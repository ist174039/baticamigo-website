export default function robots(){
  return {
    rules:[{
      userAgent:'*',
      allow:'/',
      disallow:['/area','/area/','/admin','/admin/','/platform','/platform/','/api/'],
    }],
    sitemap:'https://baticamigo.pt/sitemap.xml',
    host:'https://baticamigo.pt',
  };
}
