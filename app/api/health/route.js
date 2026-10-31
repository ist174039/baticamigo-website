export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  const raw=String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||'').trim();
  const commitSha=/^[0-9a-f]{40}$/i.test(raw)?raw:null;
  return Response.json(
    {status:'ok',service:'baticamigo-website',commitSha},
    {status:200,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}
  );
}
