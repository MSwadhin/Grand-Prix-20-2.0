
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
			console.log("Preparing :: " + this.handle);
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



function filterParticipants(participants){

    var whiteParticipants = [];
    for(i=0;i<participants.length;i++){
		if( whiteList.includes(participants[i].handle) ){
			whiteParticipants.push(participants[i]);
		}
    }
    return whiteParticipants;
}

/*
Utility to Round up to 2 Dec place if needed
*/
function roundToTwo(num) {    
    return +(Math.round(num + "e+2")  + "e-2");
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
            row += " ( "+cp.name + " )";
        }
        row += "</td>";
        row += "<td>"+ roundToTwo(cp.score) + "</td>";

        for(c=0;c<contestList.length;c++){
            var found = 0;
            var sc = 0;
            var cid = contestList[c];
            for(i=0;i<cp.contestPerformance.length;i++){
                if( cp.contestPerformance[i].contestId == cid ){
                    found = 1;
                    sc = roundToTwo(cp.contestPerformance[i].score);
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



var generateStandings =  function (participants,contestStandings){


    // alert("Generating");
    var noc = contestStandings.length;
    for(i=0;i<noc;i++){

        var oStanding = contestStandings[i];
        var len = oStanding.length;
		var curStanding = [];
		for(var l=0;l<len;l++){
			var handle = oStanding[l].party.members[0].handle;
			if( !whiteList.includes(handle) && !blackList.includes(handle) ){
				blackList.push(handle);
			}
			else curStanding.push(oStanding[l]);
		}
		console.log(curStanding[i]);
		len = curStanding.length;
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
            for(j=0;j<len;j++){
                var handle = curStanding[j].party.members[0].handle;
				console.log(handle);
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
	
	
    for(var i=0;i<participants.length;i++){
        participants[i].prepare(tot);
    }
	
	participants = filterParticipants(participants);

	var participantsWithScore = [];
	for(var i=0;i<participants.length;i++){
		if(participants[i].score>0){
			participantsWithScore.push(participants[i]);
		}
	}
    participantsWithScore.sort(
        function (a,b){
            return b.score-a.score;
        }
    );
	
	
	
	show( participantsWithScore );
    console.log(
        participants
    );
	console.log(blackList);
}


function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function getStandings(url){

	let response = await fetch(url);
	let data = await response.json();
	return data;
}



async function getContestStandings(participants){
    var handleOnUrl = "&handles=";
    for(i=0;i<participants.length;i++){
        if(i>0)handleOnUrl += ";";
        handleOnUrl += participants[i].handle;
    }
	console.log(handleOnUrl);
    var total = contestList.length;
    var standings = [];
    var done = 0;
    
    for(i=0;i<total;i++){
        let contestId = contestList[i];
        await sleep(300).then( ()=>{
            var url = 'https://codeforces.com/api/contest.standings?contestId=' + contestId + handleOnUrl;
			getStandings(url).then(
				(data) => {
					standings.push(data['result']['rows']);
					done++;
                    if(done == total){
                        generateStandings(participants,standings);
                        // console.log("Standings::");
                        // console.log(standings);
                    }
				}
			);
		} );
    }
}



function getGPStanding(){


    for(i=0;i<100;i++)scoreToGet.push(1);

    var url = 'https://codeforces.com/api/user.ratedList?activeOnly=false';
    fetch(url)
        .then( (resp) => resp.json() )
        .then( function(data){
            result = data['result'];
            participants = [];
            for(i=0;i<result.length;i++){
                if( typeof(result[i].organization)==="undefined" )continue;
                if( typeof(result[i].organization == "string") ){
					if( result[i].organization.toString().toLowerCase()==organization ){
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
			console.log(participants);
			getContestStandings(participants);
        })
        .catch( function(error) {
            console.log(error);
        });
}