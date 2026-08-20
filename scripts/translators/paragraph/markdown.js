// this translator converts paragraph in markdown innerHTML or url-output to HTML:
//
// NOTE1: to not bloat the core-codebase please define custom translators 
//       in assetscripts or webui apps. Thank you.
//
// NOTE2: 'this' is basically a paragraph janus object 

(function(){

  let markdownTranslator = {

    trimLines: function(text){
      text = text || ''
      return text.match(/[ \n]/) 
             ? text.split("\n")
                 .map( (line) => line.trim() )
                 .join("\n")
             : text
    },

    isMarkdown: function(text){
      text = markdownTranslator.trimLines(text)
      let match = text.match(/(^# |^## |^> |^\`\`\`)/gm) // naive markdown check 
      return match
    },

    markdownToHTML: function(text){
      return markdownTranslator.trimLines(text)
      .replace(/(\n|^|\s+)#(?!#) *(.*)/g, "<h1>$2</h1>")
      .replace(/(\n|^|\s+)##(?!#) *(.*)/g, "<h2>$2</h2>")
      .replace(/(\n|^|\s+)###(?!#) *(.*)/g, "<h3>$2</h3>")
      .replace(/(\n|^|\s+)####(?!#) *(.*)/g, "<h4>$2</h4>")
      .replace(/(\n|^|\s+)#####(?!#) *(.*)/g, "<h5>$2</h5>")
      .replace(/(\n|^|\s+)######(?!#) *(.*)/g, "<h6>$2</h6>")
      .replace(/(\n|^|\s+)> *(.*)/g, "<blockquote>$2</blockquote>")
      .replace(/\*\*(.*)\*\*/g, "<b>$1</b>")
      .replace(/!\[\]\((.*)\)/g, "<img src='$1'/>")
      .replace(/```(\S*)((?:[^`]|`(?!``))*)```/g, "<pre>$2</pre>")
      .replace(/(<\/h[1-6]>)\n/g, "$1")
      .replace(/\n/g, "<br>")
      .replace(/\[([^\]]+)\]\(([^\)]*)\)/g, "<a href=\"$2\">$1</a>")
      .replace(/```(?:[a-z]+)?\n?([\s\S]*?)```/gi, "<pre><code>$1</code></pre>");
    },
    
    css: (paragraph) => `
      <style type="text/css">
        .paragraphcontainer blockquote {
          border-left: 4px solid #FFF7;
          margin: 10px 0px 5px 0px;
          padding-left:10px;
        }
        .paragraphcontainer pre {
          margin:0;
          background: #0007;
          border-radius:5px;
          white-space: pre-wrap;
          padding:0px 10px 5px 10px;
        }
        .paragraphcontainer pre > code {
          font-family: monospace;
          font-size: `+paragraph.font_size+`px;
          line-height: `+paragraph.font_size/2+`px;
        }
      </style>
    `

  }

  elation.events.add(null, 'paragraph_translator_translate', function(e){
    let paragraph = e.data.paragraph
    paragraph.paragraphs = paragraph.paragraphs.map( (html) => 
      markdownTranslator.isMarkdown(html) ? markdownTranslator.css(paragraph) + markdownTranslator.markdownToHTML( html )
                                          : html
    )
  })

})();
