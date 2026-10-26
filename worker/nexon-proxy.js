/**
 * Cloudflare Worker module, no npm package required.
 * Cloudflare dashboard -> Worker -> Settings -> Variables and Secrets:
 *   NEXON_API_KEY (Secret)         Your NEXON Open API key. NEVER add it to GitHub.
 *   ALLOWED_ORIGIN (Plain text)    e.g. https://YOURNAME.github.io (no repo path)
 * GitHub Pages browser fetches GET https://WORKER.workers.dev/character?name=캐릭터명
 */
const NEXON = 'https://open.api.nexon.com/maplestory/v1';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGIN || '').replace(/\/$/, '');
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Vary': 'Origin',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    };
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: corsHeaders });

    // Allowed-Origin is a browser CORS control, not an authentication boundary.
    if (!allowed || !allowed.startsWith('https://') || origin !== allowed) {
      return new Response(JSON.stringify({ error: '허용되지 않은 출처입니다. ALLOWED_ORIGIN 설정을 확인하세요.' }), {
        status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'GET') return json({ error: 'GET 요청만 허용됩니다.' }, 405);
    if (!env.NEXON_API_KEY) return json({ error: 'Worker에 NEXON_API_KEY Secret이 설정되지 않았습니다.' }, 503);

    const url = new URL(request.url);
    if (url.pathname !== '/character') return json({ error: '해당 경로를 찾을 수 없습니다.' }, 404);
    const name = (url.searchParams.get('name') || '').trim();
    if (!name || [...name].length > 24) return json({ error: '캐릭터명은 1~24자로 입력하세요.' }, 400);

    const headers = { 'x-nxopen-api-key': env.NEXON_API_KEY, Accept: 'application/json' };
    const fetchNexon = async (path) => {
      const response = await fetch(`${NEXON}${path}`, { headers });
      if (!response.ok) {
        // Never return the upstream headers or your API key to a browser.
        const error = new Error(response.status === 404 ? '캐릭터 정보를 찾을 수 없습니다.' : `넥슨 조회 오류 (${response.status})`);
        error.status = response.status === 404 ? 404 : 502;
        throw error;
      }
      return response.json();
    };
    try {
      const { ocid } = await fetchNexon(`/id?character_name=${encodeURIComponent(name)}`);
      if (!ocid || typeof ocid !== 'string') return json({ error: '캐릭터 식별자를 조회할 수 없습니다.' }, 404);
      const safeOcid = encodeURIComponent(ocid);
      const [basicResult, statResult] = await Promise.allSettled([
        fetchNexon(`/character/basic?ocid=${safeOcid}`),
        fetchNexon(`/character/stat?ocid=${safeOcid}`),
      ]);
      if (basicResult.status === 'rejected') throw basicResult.reason;
      const basic = basicResult.value;
      const stat = statResult.status === 'fulfilled' ? statResult.value : {};
      const statStatus = statResult.status === 'fulfilled' && Array.isArray(stat.final_stat) ? 'ok' : 'unavailable';
      const list = Array.isArray(stat.final_stat) ? stat.final_stat : [];
      const findStat = (...names) => {
        const raw = list.find(s => names.includes(String(s.stat_name).replace(/\s/g,'')))?.stat_value;
        if (raw === undefined || raw === null || raw === '') return null;
        const n = Number(String(raw).replaceAll(',', ''));
        return Number.isFinite(n) ? n : null;
      };
      const combatPower = findStat('전투력');
      const arcaneForce = findStat('아케인포스', 'ARCANEFORCE');
      const authenticForce = findStat('어센틱포스', 'AUTENTICFORCE', 'AUTHENTICFORCE');
      return json({
        name: basic.character_name || name,
        image: basic.character_image || '',
        job: basic.character_class || '',
        world: basic.world_name || '',
        level: Number(basic.character_level) || 0,
        combatPower: combatPower ?? null,
        arcaneForce,
        authenticForce,
        statStatus,
        fetchedAt: basic.date || new Date().toISOString(),
      });
    } catch (error) {
      return json({ error: error.message?.slice(0, 120) || '캐릭터 조회 중 오류가 발생했습니다.' }, error.status || 502);
    }
  },
};
