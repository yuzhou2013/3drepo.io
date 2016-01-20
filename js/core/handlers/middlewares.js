// common middlewares / middleware helpers
var dbInterface = require("../db_interface.js");
var _ = require('lodash');
var resHelper = require('../response_codes');
var C               = require("../constants");
var Bid = require('../models/bid');

var getDbColOptions = function(req){
	return {account: req.params.account, project: req.params.project};
}

var middlewares = {

	checkRole: function(acceptedRoles, req){
		'use strict';
		var dbCol = getDbColOptions(req);

		return new Promise((resolve, reject) => {
			dbInterface(req[C.REQ_REPO].logger).getUserRoles(req.session[C.REPO_SESSION_USER].username, dbCol.account, function(err, roles){
				
				roles = _.filter(roles, item => {
					return acceptedRoles.indexOf(item.role) !== -1;
				});

				if(roles.length > 0){
					resolve(_.map(roles, 'role'));
				} else {
					reject(resHelper.AUTH_ERROR);
				}

			});
		});

	},

    loggedIn: function(req, res, next){
        'use strict';

        if (!(req.session.hasOwnProperty(C.REPO_SESSION_USER))) {
            resHelper.respond("Check logged in middleware", req, res, next, resHelper.AUTH_ERROR, null, req.params);
        } else {
            next();
        }
    },

	isMainContractor: function(req, res, next){
		middlewares.checkRole([C.REPO_ROLE_MAINCONTRACTOR], req).then(() => {
			next();
		}).catch(resCode => {
			resHelper.respond("Middleware: check is main contractor", req, res, next, resCode, null, req.params);
		});
	},


	isSubContractorInvitedHelper: function(req){

		return Bid.count(getDbColOptions(req), { 
			packageName: req.params.packageName,
			user: req.session[C.REPO_SESSION_USER].username
		}).then(count => {
			if (count > 0) {
				return Promise.resolve();
			} else {
				return Promise.reject(resHelper.AUTH_ERROR);
			}
		});
	},

	isSubContractorInvited: function(req, res, next){
		middlewares.isSubContractorInvitedHelper(req).then(()=>{
			next();
		}).catch(resCode => {
			resHelper.respond("Middleware: check is sub contractor invited", req, res, next, resCode, null, req.params);
		})
	}
}

module.exports = middlewares;