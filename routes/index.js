
/*
 * GET home page.
 */
exports.index = function(req, res){
  res.send('Hello World!');
  console.log("PARAMS: " + JSON.stringify(req.params) + "\n" + 
          "BODY: " + JSON.stringify(req.body) + "\n" + 
          "QUERY: " + JSON.stringify(req.query) + "\n" + 
          "COOKIES: " + JSON.stringify(req.cookies) + "\n" +
          "HEADER: " + JSON.stringify(req.header) + "\n" +
          "IP: " + JSON.stringify(req.ip) + "\n" +
          "SESSION: " + JSON.stringify(req.session) + "\n" 
          );
  req.app.get('exchange').publish('celery', create_task('rest.tasks.add', [5,9], {}, req), {contentType: 'application/json', contentEncoding: 'utf-8'});
};

function extract_info(req){
    return {
        params: JSON.stringify(req.params),
        body: JSON.stringify(req.body),
        header: JSON.stringify(req.header),
        ip: JSON.stringify(req.ip),
        session: JSON.stringify(req.session)
    }
}

function create_task(name, args, kwargs, req) {
    return {
        task: name,
        id: req.app.get('guid')(),
        args: args,
        kwargs: {}
    }
}
