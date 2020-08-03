
class Performance{
    constructor(cid,rank,score){
        this.contestId = cid;
        this.rank = rank;
        this.score = score;
    }
}

class Participant{
    constructor(handle,name,rating){
        this.handle = handle;
        this.name = name;
        this.rating = rating;
        this.score = 0.0;
        this.contestPerformance = [];
    }

    prepare = function (N){
        /// SORT
        if( this.contestPerformance.length > 0 ){
            this.contestPerformance.sort(
                function(a,b){
                    return b.score-a.score;
                }
            );
            var toget = Math.ceil( (N*7.0) / 10.0 );
            var sz = this.contestPerformance.length;
            var len = Math.min(sz,toget);
            for(i=0;i<len;i++){
                this.score += this.contestPerformance[i].score;
            }
        }
    }
}

class ContestRank{
    constructor(handle,rank){
        this.handle = handle;
        this.rank = rank;
    }
}


function filterWhteBlack(participants){

    var whiteParticipants = [];
    for(i=0;i<participants.length;i++){
        if( participants[i].score > 0 ){
            if( whiteList.includes( participants[i].handle ) ){
                whiteParticipants.push(participants[i]);
            }
            else{
                blackList.push(participants[i].handle);
            }
        }
    }
    return whiteParticipants;
    // show(whiteParticipants);
}


function show(whiteParticipants){
    contestList.reverse();
    var html = "<table>";
    html += "<tr>";
    html += "<td>Rank</td>";
    html += "<td>Participant</td>";
    html += "<td>score</td>";

    for(c=0;c<contestList.length;c++){
        var no = contestList.length-c;
        var cur = "<td> Contest "+no+"</td>";
        html += cur;
    }

    html += "</tr>";

    for(p=0;p<whiteParticipants.length;p++){
        var row = "<tr>";
        var cp = whiteParticipants[p];
        row += "<td>" + (p+1) + "</td>";
        row += "<td>" + cp.handle;
        if( cp.name != "" ){
            row += "( "+cp.name + " )";
        }
        row += "</td>";
        row += "<td>"+ cp.score + "</td>";

        for(c=0;c<contestList.length;c++){
            var found = 0;
            var sc = 0;
            var cid = contestList[c];
            for(i=0;i<cp.contestPerformance.length;i++){
                if( cp.contestPerformance[i].contestId == cid ){
                    found = 1;
                    sc = cp.contestPerformance[i].score;
                    break;
                }
            }
            row += "<td>" + sc + "</td>";
        }
        row += "</tr>";
        html += row;
    }
    html += "</table>";


    var blackTable = "<table>";
    for(i=0;i<blackList.length;i++){
        blackTable += "<tr><td>" + blackList[i] + "</td><tr>";
    }
    blackTable += "</table>";

    html += "<br>"+blackTable;

    document.getElementById("container").innerHTML = html;

}



function generateStandings(participants,contestStandings){

    var noc = contestStandings.length;
    for(i=0;i<noc;i++){

        var curStanding = contestStandings[i];
        var len = curStanding.length;
        if( len > 0 ){
            var counter = [];
            for(j=0;j<22;j++)counter[j] = 0;
            var cid = curStanding[0].party.contestId;
            var pos = 1;
            var rank = curStanding[0].rank;
            var ita = 2;
            curStanding[0].rank = pos;
            counter[1] = 1;
            for(j=1;j<len;j++){
                if( curStanding[j].rank == rank ){
                    curStanding[j].rank = pos;
                    counter[pos]++;
                }
                else{
                    pos = ita;
                    rank = curStanding[j].rank;
                    curStanding[j].rank = pos;
                    counter[pos]++;
                }
                ita++;
            }
            var scores = [];
            for(j=0;j<100;j++){
                scores[j] = scoreToGet[j];
                if( counter[j+1]>0 ){
                    scores[j] = 0;
                    for(k=j;k<j+counter[j+1];k++){
                        scores[j] += scoreToGet[k];
                    }
                    scores[j] /= counter[j+1];
                }
            }
            console.log(counter);
            console.log(scores);
            for(j=0;j<len;j++){
                var handle = curStanding[j].party.members[0].handle;
                rank = curStanding[j].rank;
                score = scores[rank-1];
                for(k=0;k<participants.length;k++){
                    if( handle == participants[k].handle ){
                        participants[k].contestPerformance.push(
                            new Performance(
                                cid,curStanding[j].rank,score
                            )
                        );
                    }
                }
            }
        }
    }


    var tot = contestList.length;

    participants[1].prepare(tot);
    for(var i=0;i<participants.length;i++){
        participants[i].prepare(tot);
    }

    participants.sort(
        function (a,b){
            return b.score-a.score;
        }
    );



    show( filterWhteBlack( participants ) );
    console.log(
        participants
    );
}



function getContestStandings(participants){
    var handleOnUrl = "&handles=";
    for(i=0;i<participants.length;i++){
        if(i>0)handleOnUrl += ";";
        handleOnUrl += participants[i].handle;
    }
    var total = contestList.length;
    var standings = [];
    var done = 0;
    for(i=0;i<total;i++){
        var contestId = contestList[i];
        var url = 'https://codeforces.com/api/contest.standings?contestId=' + contestId + handleOnUrl;
        fetch( url )
            .then( (resp)=>resp.json() )
            .then( function(data){
                done++;
                standings.push(data['result']['rows']);
                if(done == total){
                    generateStandings(participants,standings);
                    console.log(standings);
                }
            } )
            .catch( function( error ){
                alert('Error Loading Contest ==> ' + contestId + ' :: ' + error );
            } );
    }


}




function getGPStanding(){


    for(i=0;i<100;i++)scoreToGet.push(1);

    var url = 'https://codeforces.com/api/user.ratedList?activeOnly=true';
    fetch(url)
        .then( (resp) => resp.json() )
        .then( function(data){
            result = data['result'];
            participants = [];
            for(i=0;i<result.length;i++){
                if( typeof(result[i].organization)==="undefined" )continue;
                if( typeof(result[i].organization == "string") ){
                    if( result[i].organization=="" )continue;
                    if( result[i].organization.toLowerCase()==organization ){
                        var user = result[i];
                        var name = "";
                        if( typeof(user.firstName) == "string" )name += user.firstName + " ";
                        if( typeof(user.lastName) == "string" )name += user.lastName;
                        participants.push(
                            new Participant(
                                user.handle,
                                name,
                                user.rating
                            )
                        );
                    }
                }
            }
            getContestStandings(participants);
        })
        .catch( function(error) {
            console.log(error);
        });


}