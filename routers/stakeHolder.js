var express = require('express');
const router = express.Router();
var dbConnection = require('./database');
const Joi = require('@hapi/joi');


router.get('/stakeHolder/', function (req, res, next) {
    dbConnection.query('SELECT * FROM BRIDGE.Stakeholder',  function(error, results, fields) {
    //dbConnection.query('SELECT * FROM Stakeholder WHERE Client_ID = ?', req.params.Client_ID, function(error, results, fields) { 
    if (error) return next(error);
        if (!results || results.length == 0) return res.status(404).send()
        return res.send(results)
    });
});

router.get('/stakeHolder/:ID', function (req, res, next) {
    dbConnection.query('SELECT * FROM BRIDGE.Stakeholder WHERE ID = ?', [req.params.ID], function (error, results, fields) {
        
        if(error) return next (error);

        if(!results || results.length == 0) return res.status(404).send()

            var staHolder = {
                ID: results[0].ID,
                StakeholderName : results[0].StakeholderName,
                StakeholderType : results[0].StakeholderType,
                Address : results[0].Address,
                ClientName : results[0].ClientName,
                BuisnessRegistration : results[0].BuisnessRegistration,
                TIN : results[0].TIN,
                SwiftAddress : results[0].SwiftAddress,
                PaymentDue : results[0].PaymentDue,
                CntctDetail : [] 

               }

               dbConnection.query('SELECT SHContactDetails. * FROM SHContactDetails INNER JOIN Stakeholder ON SHContactDetails.Stakeholder_ID = Stakeholder_ID WHERE Stakeholder.Client_ID = ? AND Stakeholder.ID = ?', [req.params.Client_ID, req.params.ID], function (error, cntcDetailsResults, fields) {

                if (error) return next(error);
                if(!cntcDetailsResults || cntcDetailsResults.length ==0) return res.send(staHolder);

                cntcDetailsResults.forEach(extract);

                function extract(item, index) {
                    staHolder.CntctDetail.push({SHC_ID : item.SHC_ID, CDName : item.CDName, CDDesignation : item.CDDesignation, CDContactNo: item.CDContactNo, CDEmail: item.CDEmail, CDOtherContactDetails: item.CDOtherContactDetails, CDCompanyName : item.CDCompanyName })
                }
                return res.send(staHolder)
            })      
    })
})


router.post('/stakeHolder/', function (req, res) {
    
    let staHolder = req.body;

    if(!staHolder) {
        res.status(400).send({
            error : true,
            message : 'Please provide Contact Details'
        });

        res.end();
        return
    }

    const uuidv4 = require('uuid/v4')
    // let userID = req.header('InitiatedBy')
    // let clientID = req.header('Client_ID')
    let Stake_ID = uuidv4();

    var Contacts = staHolder.Contacts
    var sholder = {

        ID : Stake_ID,
        StakeholderName : staHolder.StakeholderName,
        StakeholderType : staHolder.StakeholderType,
        Address : staHolder.Address,
        ClientName : staHolder.ClientName,
        BuisnessRegistration : staHolder.BuisnessRegistration,
        TIN : staHolder.TIN,
        SwiftAddress : staHolder.SwiftAddress,
        PaymentDue : staHolder.PaymentDue,
        // Client_ID: clientID,
        // Created_By: userID,
        // IsDeleted: staHolder.false,
        // IsActive: 1
    } 

 var postsql =    dbConnection.query("INSERT INTO Stakeholder SET ?", sholder, function (error, results, fields) {
    

        if(error) {
            res.status(500).send(error);
        }
        else {
            if(!results || results.length == 0) {
                res.status(404).send();
            }
            else {
                if(Contacts && Contacts.length > 0) {

                    for (var k = 0; k < Contacts.length; k++) {

                        let contact = {
                                CDName : Contacts[k].CDName,
                                CDDesignation : Contacts[k].CDDesignation,
                                CDContactNo : Contacts[k].CDContactNo,
                                CDEmail : Contacts[k].CDEmail,
                                CDOtherContactDetails : Contacts[k].CDOtherContactDetails,
                                CDCompanyName : Contacts[k].CDCompanyName,
                                Stakeholder_ID : Stake_ID,
                        }

                        dbConnection.query("INSERT INTO SHContactDetails SET ?", contact, function (error, results, fields) {
                            if (error) {
                                console.error(errror);
                            }
                        });
                    }

                    return res.status(201).send({
                        error: false,
                        data: results,
                        message: 'New COntact Deatils has been created successfully.' 
                    });
                }
                else {
                    return res.status(201).send({
                        error: false,
                        data: results,
                        message: 'New Contact Deatils has been created successfully.'
                    });
                }
            }
        }
    } );

    console.log(postsql.sql);

});


router.put('/stakeHolder/', function (req, res) {

    let sholder = req.body;
    //let ParentID = sholder.ID;

    if(!sholder) {
        res.status(400).send({
            error : true,
            message : "Please provide stakeholder details"
        });

        res.end();
        return
    }

    dbConnection.beginTransaction(function (err) {
        if (err) {
            throw err;
        }

        var materialStake = dbConnection.query("UPDATE BRIDGE.Stakeholder SET ? WHERE ID = ?", sholder, function(error, results, fields) {
            if (error) {
                dbConnection.rollback(function() {
                    res.status(500).send(error);
                    res.end();
                    return
                });
            }

            const uuidv4 = require('uuid/v4')
            // let userID = req.header('InitiatedBy')
            // let clientID = req.header('Client_ID')
            let Stake_ID = uuidv4();

           // var Contact = sholder.CntctDetail
            var copyStakeholder = {
                ID : Stake_ID,
                StakeholderName : sholder.StakeholderName,
                StakeholderType : sholder.StakeholderType,
                Address : sholder.Address,
                ClientName : sholder.ClientName,
                BuisnessRegistration : sholder.BuisnessRegistration,
                TIN : sholder.TIN,
                SwiftAddress : sholder.SwiftAddress,
                PaymentDue : sholder.PaymentDue,
                // Client_ID: clientID,
                // Created_By: userID,
                // IsDeleted: sholder.false,
                // IsActive: 1,
                // Parent_ID : sholder.ID

            }

           var putsql =  dbConnection.query("INSERT INTO BRIDGE.Stakeholder SET ?", copyStakeholder, function (error, results, fields) {

                console.log(error);
               // console.log(putsql.sql);

                if (error) {
                    dbConnection.rollback(function() {
                        res.status(500).send(error);
                        res.end();
                        return
                    });

                }
//
                //attachment COntact Person

               var sqlput = dbConnection.query("UPDATE SHContactDetails SET ? WHERE Stakeholder_ID = ?", copyStakeholder, function (error, results, fields) {
                
                console.log(sqlput.sql);
                
                        if(error) {
                        console.error(error);
                    }
                });

             

                for(var k = 0; k < req.body.Contacts.length; k++) {

                    let contact = {
                        CDName : req.body.Contacts[k].CDName,
                        CDDesignation : req.body.Contacts[k].CDDesignation,
                        CDContactNo : req.body.Contacts[k].CDContactNo,
                        CDEmail : req.body.Contacts[k].CDEmail,
                        CDOtherContactDetails : req.body.Contacts[k].CDOtherContactDetails,
                        CDCompanyName : req.body.Contacts[k].CDCompanyName,
                        Stakeholder_ID : Stake_ID
                    }

                    dbConnection.query("INSERT INTO SHContactDetails SET ?", contact, function (error, results, fields) {
                        if(error) {
                            console.error(error);
                        }
                    })
                }


                dbConnection.commit(function (err) {
                    if (error) {
                        dbConnection.rollback(function() {
                            res.status(500).send(error);
                            res.end();
                            return
                        });
                    }

                    res.send({
                        error : false,
                        data : results,
                        message : "Contact details has been updated Successfully"
                    })

                    res.end();
                    return
                })
            })
        })

        console.log(materialStake.sql);
    })
})



router.delete('/stakeHolder/:ID', function (req, res) {

    let sholder_ID = req.params.ID;

    if (!sholder_ID) {
        res.status(400).send({
            error: true,
            message: 'Please provide Stakeholder ID'
        });
        res.end();
        return
    }

    dbConnection.query("UPDATE BRIDGE.Stakeholder SET ? WHERE ID = ?", [sholder_ID], function (error, results, fields) {

        if (error) {
            res.status(500).send(error);
        } else {

            if (!results || results.length == 0) {
                res.status(404).send({
                    error: false,
                    message: 'No records found'
                });
            } else {
                res.send({
                    error: false,
                    data: results,
                    message: 'STakeholder record has been deleted successfully.'
                });
            }
        }
        res.end();
        return
    });
});


module.exports = router;

/*
{
    "ID": "0468a5e5-cac2-43d1-ba7c-9f39d7234c66",
    "StakeholderName": "898988",
    "StakeholderType": "8989898",
    "Address": "9898989",
    "ClientName": "stake101",
    "BuisnessRegistration": "stake101",
    "TIN": "stake101",
    "SwiftAddress": "stake101",
    "PaymentDue": "2018.03.04",
    "Client_ID": "Hasindu",
    "Contacts" : [
        {
            "CDName" : "89898",
            "CDDesignation" : "89898",
            "CDContactNo" : "898989",
            "CDEmail" : "89898",
            "CDOtherContactDetails" : "9898",
            "CDCompanyName" : "9898"
            "Stakeholder_ID" : "0468a5e5-cac2-43d1-ba7c-9f39d7234c66"
            
        }]
}
*/

