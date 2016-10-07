var elasticsearch = require('elasticsearch');
var nopt = require('nopt');
var noptUsage = require("nopt-usage");

var username = 'elastic';
var password = 'changeme'
var host = 'localhost';
var protocol = 'http';
var port = 9200;
var client = new elasticsearch.Client({
  log: 'error',
  host: [{
    protocol: protocol,
    host: host,
    port: port,
    auth: username + ':' + password
  }],
  apiVersion: 'master'
});

var knownOpts = {
  'index': String,
  'type': [String],
  'query': String,
},
shortHands = {
  'i': ['--index'],
  't': ['--type'],
  'q': ['--query'],
},
description = {
  'index': ' Index to dump',
  'type': ' Document type(s) to dump',
  'query': ' Lucene query to select dumped documents',
},
options = nopt(knownOpts, shortHands, process.argv, 2);
if (!options['index']) {
  console.error('Required parameter missing: index');
  process.exit();
}

client.indices.exists({index: options['index']}).then(function(res) {
  var params = { index: options['index']};
  if (options['type']) {
    params.type = options['type'];
  }
  if (options['query']) {
    params.q = options['query'];
  }
  client.search(params).then(function(results) {
    var hits = results.hits.hits;
    // console.log(hits);
    for (var i=0; i<hits.length; i++) {
      var meta = {
        index: hits[i]._index,
        type: hits[i]._type,
        id: hits[i]._id,
      };
      var data = hits[i]._source;
      console.log(JSON.stringify(meta));
      console.log(JSON.stringify(data));
    }
  }).catch(function(error) {
    console.trace(error);
  });
}).catch(function(error) {
  console.error('Index ' + options['index'] + ' not found!');
});
