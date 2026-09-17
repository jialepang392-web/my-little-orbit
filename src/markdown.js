// Deliberately small, safe Markdown subset: headings, lists, quotes, fenced code,
// emphasis and http(s)/mailto links. Raw HTML and embedded images are NOT enabled.
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function inlineMarkdown(text) {
  const tokens=[];
  // Extract code and links before formatting. URLs are protocol-allowlisted.
  const source=String(text).replace(/`([^`]+)`|\[([^\]]+)\]\(([^\s)]+)\)/g,(_match,code,label,url)=>{
    const html=code!==undefined?`<code>${escapeHtml(code)}</code>`:/^(https?:\/\/|mailto:)/i.test(url)?`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`:escapeHtml(label);
    tokens.push(html);return `\u0000${tokens.length-1}\u0000`;
  });
  return escapeHtml(source).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\u0000(\d+)\u0000/g,(_m,index)=>tokens[Number(index)]??'');
}
export function renderMarkdown(source) {
  const output=[],paragraph=[];let inCode=false,code=[],inList=false;
  const flushParagraph=()=>{if(paragraph.length){output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);paragraph.length=0;}};
  const endList=()=>{if(inList){output.push('</ul>');inList=false;}};
  for(const line of String(source).replace(/\r\n/g,'\n').split('\n')){
    if(line.startsWith('```')){flushParagraph();endList();if(inCode){output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);code=[];}inCode=!inCode;continue;}
    if(inCode){code.push(line);continue;}
    const heading=line.match(/^(#{1,4})\s+(.+)$/),bullet=line.match(/^[-*]\s+(.+)$/),quote=line.match(/^>\s?(.*)$/);
    if(heading){flushParagraph();endList();const level=Math.min(heading[1].length+1,4);output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);}
    else if(bullet){flushParagraph();if(!inList){output.push('<ul>');inList=true;}output.push(`<li>${inlineMarkdown(bullet[1])}</li>`);}
    else if(quote){flushParagraph();endList();output.push(`<blockquote><p>${inlineMarkdown(quote[1])}</p></blockquote>`);}
    else if(!line.trim()){flushParagraph();endList();}
    else{endList();paragraph.push(line);}
  }
  flushParagraph();endList();if(inCode)output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  return output.join('\n');
}
