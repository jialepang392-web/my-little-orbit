// Preserve older direct article/reading URLs after the homepage becomes a gallery.
const query=new URLSearchParams(location.search);
if(query.get('mode')==='read'||location.hash.startsWith('#post/')){
  location.replace('./poem.html'+location.search+location.hash);
}
