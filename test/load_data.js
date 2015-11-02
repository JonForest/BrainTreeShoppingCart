var _ = require('lodash');
var inkub8_schemas = require('inkub8_schemas')();

function loadMentors(db, done) {
    var User = db.model('User');
    //Create array of mentors
    var mentors = [];
    for (var x = 0; x < 2; x++) {
        var mentor = {};
        _.extend(mentor, mentorArgs);
        mentor.firstName = mentor.firstName + x.toString();
        mentor.surname = mentor.surname + x.toString();
        mentor.email = 'mentor' + x.toString() + '@test.com';
        mentors.push(mentor);
    }

    //Very aware this is not a true batch insert - see
    // http://stackoverflow.com/questions/10266512/how-can-i-save-multiple-documents-concurrently-in-mongoose-node-js/16866489#16866489
    User.create(mentors, function (err) {
        if (!err) {
            var mentorDocs = [];
            for (var i=0; i<arguments[1].length; ++i) {
                mentorDocs.push(arguments[1][i]);
            }
            done(mentorDocs);
        }
    });
}

function loadEntrepreneurs(db, done) {
    var User = db.model('User');
    //Create array of mentors
    var entrepreneurs = [];
    for (var x = 0; x < 2; x++) {
        var entrepreneur = {};
        _.extend(entrepreneur, entArgs);
        entrepreneur.firstName = entrepreneur.firstName + x.toString();
        entrepreneur.surname = entrepreneur.surname + x.toString();
        entrepreneur.email = 'entrepreneur' + x.toString() + '@test.com';
        entrepreneurs.push(entrepreneur);
    }

    User.create(entrepreneurs, function (err) {
        if (!err) {
            var entDocs = [];
            for (var i=0; i<arguments[1].length; ++i) {
                entDocs.push(arguments[1][i]);
            }
            done(entDocs);
        }
    });
}

/**
 * Loads entrepreneurs and links them to new projects
 * @param {object} db
 * @param {function} done
 */
function loadProjects(db, done) {
    var Project = db.model('Project');
    var projects = [];
    loadEntrepreneurs(db, function(ents) {
        ents.forEach(function(ent) {
            var project = {};
            _.extend(project, projectArgs);
            project.user = ent.id;
            project.status = {};
            project.type = 'halftools';
            project.status.progress = inkub8_schemas.getMilestones('halftools');
            project.status.currentStatusId = '1.1.1';
            projects.push(project);
        });

        Project.create(projects, function(err) {
            if (!err) {
                var entDocs = [];
                for (var i=0; i<arguments[1].length; ++i) {
                    entDocs.push(arguments[1][i]);
                }
                done(entDocs, ents);
            }
        });
    });
}

var entArgs = {
    email: 'jonforest@gmail.com',
    hashedPassword: 'sdfkjhs9sdhfs',
    firstName: 'Jonathan',
    surname: 'Hollingsworth',
    type: 'entrepreneur',
    authenticationToken: 'sdfsdfsr324r'
};

var mentorArgs = {
    email: 'mentor@test.com',
    hashedPassword: 'sdfkjhs9sdhfs',
    firstName: 'Mentor',
    surname: 'One',
    type: 'mentor',
    authenticationToken: 'sdfsdfsr324r435'
};

var projectArgs = {
    dropsheet : {
        briefDescription : 'A brief description',
        revenueModelOutline: 'a revenue model outline',
        competitionOutline: 'a competition outline',
        initialProgress: 'initial progress',
        entrepreneurObjectives: 'the entrepreneur objectives',
        skills: 'some skills',
        keywords: ['keyword1', 'keyword2']
    },
    createdAt: new Date()
};

exports.loadMentors = loadMentors;
exports.loadEntrepreneurs = loadEntrepreneurs;
exports.loadProjects = loadProjects;
exports.entArgs = entArgs;