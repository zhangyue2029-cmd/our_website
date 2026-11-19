/** Learning/exploration groupings, not official majors or personality categories.
 * Curriculum references support subject themes; career subsets are editorial choices
 * intersected with the unchanged original major -> career associations by the API.
 */
export const directionSources = {
 chinese:{title:'长江大学汉语言文学专业人才培养方案',url:'https://zhongwen.yangtzeu.edu.cn/info/1014/2590.htm'},
 journalism:{title:'中国社会科学院大学新闻学专业培养方案（2024年版）',url:'https://media.ucass.edu.cn/info/1024/2011.htm'}
};
export const majorDirections = {
 chinese:[
  {id:'chinese-literature',name:'文学阅读与文本研究',intro:'从古今文学、作品阅读与文本分析出发，探索内容与叙事。',topics:['中国古代文学','中国现当代文学','外国文学','文学理论'],careerIds:['editor','screenwriter','publisher'],art:'literature'},
  {id:'chinese-language',name:'语言与写作表达',intro:'从汉语、语言运用和写作实践出发，探索文字如何被理解。',topics:['现代汉语','古代汉语','语言学','写作实践'],careerIds:['copywriter','journalist','content-ops','brand'],art:'literature'},
  {id:'chinese-publishing',name:'文本编辑与出版探索',intro:'关注文字质量、内容组织与出版流程，是本站组合的职业探索路径。',topics:['文本分析','编辑实践','内容组织'],careerIds:['publisher','editor','content-ops','pm'],art:'modules'},
  {id:'chinese-teaching',name:'语文教学与知识表达',intro:'了解文本如何成为可学习的知识；师范课程和任教资格以所在院校及实际要求为准。',topics:['文本理解','语文教学（师范相关）','知识讲解'],careerIds:['teacher','publisher','user-ops'],art:'literature'}
 ],
 journalism:[
  {id:'journalism-reporting',name:'新闻采访与报道',intro:'从现场、事实核实与公共叙事出发，了解采写编评的工作。',topics:['新闻采访','新闻写作','新闻编辑','新闻评论'],careerIds:['journalist','editor','pr'],art:'broadcast'},
  {id:'journalism-media',name:'视听与新媒体内容',intro:'从影像表达和媒介形式出发，探索内容的制作与传播。',topics:['广播电视','新闻摄影','数字媒体','内容创作'],careerIds:['video','new-media','content-ops'],art:'film'},
  {id:'journalism-brand',name:'品牌与公共传播探索',intro:'将传播、表达与媒介知识连接到品牌、公关和营销职业。',topics:['传播学','传播心理','媒介经营','公共沟通'],careerIds:['brand','pr','marketing','copywriter'],art:'signal'},
  {id:'journalism-digital',name:'数字传播与用户研究',intro:'从研究方法、数据和媒介技术出发，探索产品与用户需求。',topics:['传播研究方法','数据与可视化','数字媒介'],careerIds:['pm','user-ops','content-ops','new-media'],art:'modules'}
 ]
};
export const directionNote='这里是学习领域与职业探索路径，不是教育主管部门的本科细分专业目录，也不代表每所院校都开设同名培养方向。职业关联为本站探索配置，可随时查看原专业全部职业。';
