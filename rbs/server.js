//web server setup
var express = require('express');
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');
var md5 = require('./md5');
var googleapis = require('googleapis');
var googleAuth = require('google-auth-library');

var server = express();

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), { flags: 'a' })

//logger
server.use(morgan('combined', { stream: accessLogStream }))

//server
server.use('/', express.static(__dirname + '/public'));
server.get('/apiinfo', function(req, res) {
    // res.send('This is a list of api functions available<br>Here too.')
    res.sendfile('./public/apiinfo.html')
});
server.get('/getcal/:cid', function(req, res) {
    var cid = req.params.cid.toString();
    var cal = findObj(calendarlist, cid);
    if (cal.id == cid) {
        console.log(cal.data.items.length);
        for(var j = 0 ; j < cal.data.items.length ; j++){
            if(cal.data.items[j].visibility){
                if(cal.data.items[j].visibility == 'private'){
                    cal.data.items[j].summary = "Private Event";
                    cal.data.items[j].attendees = [];
                    cal.data.items[j].creator = {email:"Not Available"};
                    cal.data.items[j].organizer = {email:"Not Available"};
                }
            }
        }
        res.send({ "name": cal.name, "items": cal.data.items });
    } else {
        res.send("you are NOT allowed!");
    }
});
server.get('/confirm/:cid/:eid', function(req, res) {
    var cid = req.params.cid.toString();
    var eid = req.params.eid.toString();
    var cal = findObj(calendarlist, cid);
    var cev = confirmEvent(cal, eid);
    res.send(cev);
});
server.get('/cut/:cid/:eid/:ts', function(req, res) {
    var cid = req.params.cid.toString();
    var eid = req.params.eid.toString();
    var ts = req.params.ts.toString();
    var cal = findObj(calendarlist, cid);
    var cev = cutEvent(cal, eid, ts);
    res.send(cev);
});

var key = require('./server.json');
var calendar = googleapis.calendar('v3');
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2();

var jwtClient = new googleapis.auth.JWT(
    key.client_email,
    null,
    key.private_key, ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.readonly'],
    '708497098884-f32pd1cegl8pge88h6mjp9kudrlbk3pm@developer.gserviceaccount.com'
);

jwtClient.authorize(function(err, tokens) {
    if (err) {
        console.log(err);
        return;
    } else {}
})

//calendar variables and functions
//calendar lis has to be edited to include all rooms.
//updateAllCals() contains a refresh timer of xxx seconds denoted by setTimeout(function(){updateAllCals()}, xxx)
var calendarlist = [{
    "id": "BlackPig",
    "unmd5d": "HURROW",
    "name": "Black Pig",
    "calid": "greenpeace.org_2d31383936353832352d353530@resource.calendar.google.com",
    "data": null
}, {
    "id": "EngineRoom",
    "unmd5d": "",
    "name": "Engine Room",
    "calid": "greenpeace.org_2d36383931333331332d373332@resource.calendar.google.com",
    "data": null
}, {
    "id": "PataGorda",
    "unmd5d": "",
    "name": "Pata Gorda",
    "calid": "greenpeace.org_38373535343734303235@resource.calendar.google.com",
    "data": null
}, {
    "id": "ArcticSunrise",
    "unmd5d": "",
    "name": "Arctic Sunrise",
    "calid": "greenpeace.org_3832363538313034373935@resource.calendar.google.com",
    "data": null
}, {
    "id": "Beluga",
    "unmd5d": "",
    "name": "Beluga",
    "calid": "greenpeace.org_35393333323134333436@resource.calendar.google.com",
    "data": null
}, {
    "id": "PhyllisCormack",
    "unmd5d": "",
    "name": "Phyllis Cormack",
    "calid": "greenpeace.org_33323432393438313033@resource.calendar.google.com",
    "data": null
}, {
    "id": "RadioRoom",
    "unmd5d": "",
    "name": "Radio Room",
    "calid": "greenpeace.org_2d36353131333832383432@resource.calendar.google.com",
    "data": null
}, {
    "id": "RainbowWarrior",
    "unmd5d": "",
    "name": "Rainbow Warrior",
    "calid": "greenpeace.org_2d3932343437383231@resource.calendar.google.com",
    "data": null
}, {
    "id": "SteeringRoom",
    "unmd5d": "",
    "name": "Steering Room",
    "calid": "greenpeace.org_37383833303230372d353230@resource.calendar.google.com",
    "data": null
}];

updateAllCals();

function updateAllCals() {
    for (var i = 0; i < calendarlist.length; i++) {
        updateList(calendarlist[i]);
        console.log("-----> updating calendar : " + calendarlist[i].name)

    }
    setTimeout(function() { updateAllCals() }, 2000)
}

function findObj(arrayin, searchid) {
    for (var j = 0; j < arrayin.length; j++) {
        if (arrayin[j].id == searchid) {
            return arrayin[j];
            console.log("found in array!")
        }
    }
    return "nada";
}
//confirmEvent('greenpeace.org_2d31383936353832352d353530@resource.calendar.google.com', '"8hjvfe7cp8g7rc3uvq25ghbt80"');
function confirmEvent(calendarid, eventid) {
    console.log("<<<calendarid>>> "+calendarid.calid+" <<<eventid>>> " + eventid);
    calendar.events.patch({
        auth: jwtClient,
        calendarId: calendarid.calid,
        eventId: eventid,
        resource: {
            'extendedProperties': {
                'private': {
                    'padconfirmed': 'true'
                }
            }
        }
    }, function(err, resp) {
        if (err) {
            return err;
        } else {
            return resp;
        }
    });
    return "";
}
function cutEvent(calendarid, eventid, ts) {
    console.log("<<<calendarid>>> "+calendarid.calid+" <<<eventid>>> " + eventid);
    calendar.events.patch({
        auth: jwtClient,
        calendarId: calendarid.calid,
        eventId: eventid,
        resource: {
            'end': {
                'dateTime': ts
            }
        }
    }, function(err, resp) {
        if (err) {
            return err;
        } else {
            return resp;
        }
    });
    return "";
}

function updateList(calendarlistobj) {
    //console.log("found " + calendarlistobj.id + " with calendarid " + calendarlistobj.calid);
    // Make an authorized request to list Drive files.
    var midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    midnight = midnight.toISOString();
    var today = (new Date()).toISOString();

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(01, 01, 01, 001);
    tomorrow = tomorrow.toISOString();

    var tomorrow_midnight = new Date();
    tomorrow_midnight.setDate(tomorrow_midnight.getDate() + 1);
    tomorrow_midnight.setHours(23, 59, 59, 999);
    tomorrow_midnight = tomorrow_midnight.toISOString();

    calendar.events.list({
        auth: jwtClient,
        calendarId: calendarlistobj.calid,
        timeMin: today,
        timeMax: midnight,
        singleEvents: true,
        orderBy: "startTime"
    }, function(err, resp) {
        if (err) {
            //console.log("Error: " + err)
            //return err;
        } else {
            //console.log(resp.toString());
            //console.log(calendarlistobj);
            calendarlistobj.data = resp;
            //return resp;
        }
    });
}

//start server
server.listen(8080);
