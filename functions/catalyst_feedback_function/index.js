var express = require('express');
var app = express();
app.use(express.json()); // This supports the JSON encoded bodies
var catalyst = require('zcatalyst-sdk-node');

///APIs
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
    var rowData = {}
    rowData["Idea"] = req.body.Idea;
    rowData["Name"] = req.body.Name;
    rowData["Email"] = req.body.Email;
    rowData["Feature"] = req.body.Feature;
    rowData["Description"] = req.body.Description;
    var text = req.body.Idea.concat(". ")
    text = text.concat(req.body.Description)
    analyseIdea(text, catalystApp)
    storeSummaryForFeature(catalystApp, rowData, req)
    res.send(req.body.Idea);
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

///DB operations
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
///Zia analytics
function analyseIdea(ideaText, app, rowData) {
    let zia = app.zia()
    var datastore = app.datastore();
    var table = datastore.table('Feedback');
    var resultJSON
    console.log("Text analysis: " + ideaText)
    zia.getTextAnalytics([ideaText]).then(result => {
        console.log(JSON.stringify(result));
        if (result.keyword_extractor.keyphrases.length > 0) {
            var insertPromise = table.insertRow(rowData);
            insertPromise.then((row) => {
                console.log("Feedback addedd successfully")
            }).catch(err => {
                console.log(err);
                sendErrorResponse(res);
            });
        } else {
            console.error("No valid keywords")
        }
    }).catch(err => {
        console.error("err")
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