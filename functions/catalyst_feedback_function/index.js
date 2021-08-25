var express = require('express');
var app = express();
app.use(express.json()); // This supports the JSON encoded bodies
var catalyst = require('zcatalyst-sdk-node');

app.get('/support/ideas/:feature', function(req, res) {
    var catalystApp = catalyst.initialize(req);
    var data = [];
    var feature = req.params.feature;
    console.log(feature)
    getIdeasForFeature(catalystApp, feature).then(
        ideas => {
            console.log('Sanity: ' + JSON.stringify(ideas));
            res.send(ideas)
        }
    ).catch(err => {
        console.log(err);
        sendErrorResponse(res);
    })
});

app.post('/support/feedback', function(req, res) {
    console.log(req.body);
    var catalystApp = catalyst.initialize(req);
    var datastore = catalystApp.datastore();
    var table = datastore.table('Feedback');
    var rowData = {}
    rowData["Idea"] = req.body.Idea;
    rowData["Name"] = req.body.Name;
    rowData["Email"] = req.body.Email;
    rowData["Feature"] = req.body.Feature;
    rowData["Description"] = req.body.Description;
    storeSummaryForFeature(catalystApp, rowData, req)
    var insertPromise = table.insertRow(rowData);
    insertPromise.then((row) => {
        res.send(req.body.Idea);
    }).catch(err => {
        console.log(err);
        sendErrorResponse(res);
    });
});

app.get('/support/feedback', function(req, res) {
    var catalystApp = catalyst.initialize(req);
    var data = {};
    var feature = req.params;
    getSummaryForFeature(catalystApp).then(
        ideas => {
            ideas.forEach(element => {
                if (element.Summary.Feature in data) {
                    var ideas = data[element.Summary.Feature]
                    var ideaArray = ideas.split(",")
                    ideaArray.push(element.Summary.Idea)
                    data[element.Summary.Feature] = ideaArray.join()
                } else {
                    data[element.Summary.Feature] = element.Summary.Idea;
                }
                console.log(element.Summary);
            });
            console.log('Sanity: ' + JSON.stringify(data));
            res.send(data)
        }
    ).catch(err => {
        console.log(err);
        sendErrorResponse(res);
    })
});

function getIdeasForFeature(catalystApp, feature) {
    return new Promise((resolve, reject) => {
        catalystApp.zcql().executeZCQLQuery("SELECT Idea FROM Feedback WHERE Feature=\'" + feature + "\'").then(queryResponse => {
            console.log(queryResponse)
            var data = [];
            for (feedback in queryResponse) {
                console.log(feedback)
                data.push(feedback.Idea)
            }
            resolve(data);
        }).catch(err => {
            console.log(err);
            reject(err);
        })
    });
}

function storeSummaryForFeature(catalystApp, rows, req) {
    var catalystApp = catalyst.initialize(req);
    var datastore = catalystApp.datastore();
    var table = datastore.table('Summary');
    var rowData = {}
    rowData["Idea"] = rows["Idea"];
    rowData["Feature"] = rows["Feature"];
    let insertPromise = table.insertRow(rowData);
    insertPromise.then((row) => {
        console.log(row);
    }).catch(err => {
        console.log(err);
    });
}

function getSummaryForFeature(catalystApp) {
    return new Promise((resolve, reject) => {
        catalystApp.zcql().executeZCQLQuery("Select * from Summary").then(queryResponse => {
            resolve(queryResponse);
        }).catch(err => {
            reject(err);
        })
    });
}
/**
 * Sends an error response
 * @param {*} res 
 */
function sendErrorResponse(res) {
    res.status(500);
    res.send({
        "error": "Internal server error occurred. Please try again in some time."
    });
}

module.exports = app;