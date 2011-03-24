var sys = require("sys");
var ObjectID = require("mongodb/lib/mongodb/bson/bson").ObjectID;
var DBRef = require("mongodb/lib/mongodb/bson/bson").DBRef;
var date = require("./date");

var decodeIfNested = function(path, value, data) {
	if(path.length > 1) {
		data = data[path[0]] = {};
		path.shift();
		decodeIfNested(path, value, data);
	} else
		data[path[0]] = decodeField(value);
};

var decodeField = function(value) {
  if(typeof value == "object" && value['namespace'] && value['oid']) {
    if(/^[0-9a-fA-F]{24}$/.test(value['oid']))
        return new DBRef(value['namespace'], new ObjectID(value['oid']));
    else
        return new DBRef(value['namespace'], value['oid']);
  }
  
  if(date.isISO8601(value))
     return new Date(value);
     
  return value;
}

var deepDecode = function(obj) {
    for(var i in obj)
       if(typeof obj[i] == "object" && 
          typeof obj[i]['namespace'] == "undefined" && 
          typeof obj[i]['oid'] == "undefined")
          
           deepDecode(obj[i]);
       else
           obj[i] = decodeField(obj[i]);
};

exports.query = function(req, res, query, options) {
    deepDecode(query);
}

exports.put = function(req, res, spec, data) {
    if(/^[0-9a-fA-F]{24}$/.test(req.params.id))
	    spec['_id'] = new ObjectID(req.params.id);
	else
	    spec['_id'] = req.params.id;

	data.$set = {};
	data = data.$set;
	for(var i in req.body.data)
			if(i != '_id') // protect _id
				if(i.indexOf(".") == -1)
					data[i] = decodeField(req.body.data[i]);
				else
					decodeIfNested(i.split("."), req.body.data[i], data);
};

exports.post = function(req, res) {
	deepDecode(req.body);
};

exports.del = function(req, res, spec) {
	if(/^[0-9a-fA-F]{24}$/.test(req.params.id))
	    spec['_id'] = new ObjectID(req.params.id);
	else
	    spec['_id'] = req.params.id;
}
