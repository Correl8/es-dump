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
/*
  'from': Number,
  'size': Number
*/
},
shortHands = {
  'i': ['--index'],
  't': ['--type'],
  'q': ['--query'],
/*
  'f': ['--from'],
  's': ['--size'],
*/
},
description = {
  'index': ' Index to dump',
  'type': ' Document type(s) to dump',
  'query': ' Lucene query to select dumped documents',
/*
  'from': ' Start from index <from>',
  'size': ' Return at most <size> results',
*/
},
options = nopt(knownOpts, shortHands, process.argv, 2);
if (!options['index']) {
  console.error('Required parameter missing: index');
  process.exit();
}

client.indices.exists({index: options['index']}).then(function(res) {
  var params = { index: options['index'] };
 /*
  params.size = options['size'] || 10000;
  params.from = options['from'] || 0;
 */
  params['scroll'] = '30s';
  if (options['type']) {
    params.type = options['type'];
  }
  if (options['query']) {
    params.q = options['query'];
  }
  var passed = 0;
  client.search(params, function dump(error, results) {
    if (error) {
      console.error(error);
      process.exit();
    }
    var hits = results.hits.hits;
    var totalHits = hits.length;
    // console.log(hits);
    for (var i=0; i<hits.length; i++) {
      var meta = {
        index: {
          _index: hits[i]._index,
          _type: hits[i]._type,
          _id: hits[i]._id
        }
      };
      var data = hits[i]._source;
      console.log(JSON.stringify(meta));
      console.log(JSON.stringify(data));
    }
    passed += hits.length;
    if (passed < results.hits.total) {
      var scrollParams = {
        scrollId: results._scroll_id,
        scroll: '30s'
      };
      return client.scroll(scrollParams, dump);
    }
  });
}).catch(function(error) {
  console.error('Index ' + options['index'] + ' not found!');
});
