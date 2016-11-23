
app.controller("teamPanelCtrl", function($scope,$rootScope,user,$firebaseArray,$window) {

		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courseFB=$firebaseArray(courses);
		
		var team = firebase.database().ref("Team");
		$scope.teamFB=$firebaseArray(team);
		
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userAccount = $firebaseArray(userAccount);
		
		$scope.existedTeam=[];
		$scope.existedTeamData=[];
		$scope.ckey="";
		$scope.studentList=[];
		

		$scope.doRedirect=function(href)
		{
			$window.location.href=href;
		}
		
		
		//load the team ID
		 $scope.loadExistedTeam=function()
		{
			var tmpTeam=[];
			
			firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) {
				
				if(typeof(data.val().team)!="undefined")
				{
					
					for(i=0;i<data.val().team.length;i++)
					{			
						
						firebase.database().ref("Team/"+data.val().team[i]).once('value', function(data) {
							if(typeof(data.val().request)!="undefined")
							{
								if(data.val().request.indexOf($scope.email)>-1)//if current user's email is in team request array, mark it as joined
								{		
									tmpTeam.push({"key":data.getKey(),"data":data.val(),"joined":true});		
								}
								else
								{
									tmpTeam.push({"key":data.getKey(),"data":data.val(),"joined":false});	
								}
							}
							else
							{
								tmpTeam.push({"key":data.getKey(),"data":data.val(),"joined":false});	
							}							
						});
	
					}
					$scope.existedTeam=tmpTeam;
				}
	
			});
	
		}
		
		$scope.pathStringCheck=function()
		{
			var invalidSet=['.','#','$','[',']'];
			for(i=0;i<invalidSet.length;i++)
			{
				if($scope.ikey.indexOf(invalidSet[i])>-1)
				{
					return true;
				}
			}
			return false;
		}
		
		//load team data
		$scope.accessValidCheck=function(key)
		{
		
			$scope.ikey=key;

			if($scope.ikey==null||$scope.ikey==""||$scope.pathStringCheck())
			{
				$scope.doRedirect("index.html");			
			}
			else
			{

				firebase.database().ref("Team/"+$scope.ikey).once('value', function(data) {

					if(data.val()==null)
					{
						$scope.doRedirect("index.html");		
					}
					else
					{
						$scope.existedTeamData.push(data.val());
					}
				});
			}
			
		}
		
		 $scope.userObjectArrayPush=function(email,array)
		{
			userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
			{
				array.push({"key":data.getKey(),"data":data.val()});
			});
				
		}
		
		$scope.loadStudentList=function(key)
		{
			firebase.database().ref("courses/"+key).once('value', function(data) {
				var tmp=[];
				var courseData=data.val();
				for(i=0;i<courseData.student.length;i++)
				{
					$scope.userObjectArrayPush(courseData.student[i],tmp);
				}
				$scope.studentList=tmp;		
			});	
		}
		
		//true = random
		//false = recommend forming	
		$scope.autoTeamForming=function(random)
		{
			
			if(random)
			{
				$scope.ckey=$scope.gup('c', window.location.href);
				$scope.loadStudentList($scope.ckey);
				
				var formingResult = [];
				var tempTeamList = [];
				var studentList = $scope.studentList;
				
				//the max and min number of the member
				var avgTeamMemberNumber = Math.ceil((3+2)/2);
				var numberOfTeam = Math.ceil(studentList.length/avgTeamMemberNumber);
				
				//creat team
				for(var i=0;i<numberOfTeam;i++)
				{
					var tempTeam =[];
					tempTeam.name = "random team "+(i+1);
					tempTeam.memberNumber = 0;
					tempTeam.teamMember = [];
					tempTeamList.push(tempTeam);
				}
				
				
				//random assign students to team
				for(;studentList.length>0 && tempTeamList.length>0;)
				{
					
					//random between temp team
					console.log(tempTeamList);
					var assignTeam = Math.floor((Math.random() * numberOfTeam) + 1);
					console.log(assignTeam);
					tempTeamList[assignTeam-1].teamMember.push(studentList.pop().key);
					
					
					//take out the team if meet the expected team member number
					if(tempTeamList[assignTeam-1].teamMember.length>=numberOfTeam)
					{
						
						formingResult.push( tempTeamList.splice(assignTeam-1, 1));
						
						/*
						//swap the team to last one
						var temp = tempTeamList[assignTeam-1];
						tempTeamList[assignTeam-1] = tempTeamList[tempTeamList.length-1];
						tempTeamList = temp;
						
						//push the finished team to the result
						formingResult.push(tempTeamList.pop());
						
						*/
						numberOfTeam--;
						
					}
					
					
				}
				console.log(studentList.length );
				console.log(tempTeamList.length );
				
				//if no student remain
				if(studentList.length==0)
				{
					//push all team to the result
					for(;tempTeamList.length>0;)
					{
						formingResult.push( tempTeamList.splice(0, 1));
					}
				}else //if student remain assign all of them to the team
				{
					for(var i=0;studentList.length>0;i++)
					{
						tempTeamList[i].teamMember.push(studentList.pop().key);
					}
				}
				
				
				
					console.log(formingResult);
				
				
			}else
			{
				$scope.ckey=$scope.gup('c', window.location.href);
				$scope.loadExistedTeam();
				for(var i=0;i<$scope.existedTeam.length;i++)
				{
					$scope.accessValidCheck($scope.existedTeam[i].key);
				}
				
				console.log($scope.existedTeamData);
			}
			
			
			
		}
	
		$scope.updateRole=function()
		{
			$scope.email=user.email;
			$scope.role=user.role;
			$scope.userName=user.userName;
			$scope.key=user.key;
			$scope.course=user.course;
			$scope.team=user.team;
		}
	
		$scope.currCourse={};		
		$scope.teamMember=[];
		$scope.waitingList=[];
		$scope.inviteList=[];
		$scope.studentList=[];
		$scope.ckey;
		$scope.tkey;
		$scope.tLeaderID;
		
		$rootScope.$on("updateRole", function(){
			   $scope.updateRole();
			   $scope.loadcoursesInfo();
			   
		});
		
		$scope.deleteInviteRequest=function(email,uKey)
		{
			firebase.database().ref("Team/"+$scope.tkey).once('value', function(data) {
				var teamData=data.val();
				$scope.removeElementFromArrayByValue(email,teamData.invite);
				firebase.database().ref("Team/"+$scope.tkey).set(teamData).then(function(){
					userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
					{
						var userData=data.val();
						$scope.removeElementFromArrayByValue(email,userData.invite[$scope.ckey]);
						if(jQuery.isEmptyObject(userData.invite))
						{
							delete userData["invite"];
						}
						firebase.database().ref("UserAccount/"+uKey).set(userData).then(function(){
							
							$scope.loadInviteList(teamData);
						});
						
					});
					
					
					
				});
			});
		}

		$scope.addInviteRequest=function(userData,key)
		{
			if(typeof(userData.invite)=="undefined")
			{
				userData.invite=[];
			}
			if(typeof(userData.invite[$scope.ckey])=="undefined")
			{
				userData.invite[$scope.ckey]=[];
			}
			userData.invite[$scope.ckey].push($scope.tkey);
			firebase.database().ref("UserAccount/"+key).set(userData).then(function(){
				
				firebase.database().ref("Team/"+$scope.tkey).once('value', function(data) {
					
					var teamData=data.val();
					if(typeof(teamData.invite)=="undefined")
					{
						teamData.invite=[];
					}
					teamData.invite.push(userData.email);
					firebase.database().ref("Team/"+$scope.tkey).set(teamData).then(function(){
						
						//handle ...
						$scope.loadInviteList(teamData);
						 $.fancybox.close();
					});
					
				});
				
			});
			
		}
		
		$scope.inviteValidCheck=function(key,email)
		{
			if($scope.email==email)
			{
				alert("you can't invite yourself");
				return;
			}
			else
			{
				firebase.database().ref("Team/"+$scope.tkey).once('value', function(data) {
					
					var teamData=data.val();
					if(typeof(teamData.invite)!="undefined"&&teamData.invite.indexOf(email)>-1)
					{
						alert("you have invited this student  alredy");
					}
					else
					{
						firebase.database().ref("UserAccount/"+key).once('value', function(data) {
							var userData=data.val();
							if(typeof(userData.team)!="undefined")
							{
								if(userData.team.hasOwnProperty($scope.ckey))
								{
									alert("this student has a team already");
									return;
								}
								else
								{
									$scope.addInviteRequest(userData,key);
								}
							}
							else
							{
								$scope.addInviteRequest(userData,key)
							}
						});
						
					}
					
					
				});
				

			}
		}
		
		$scope.inviteHandler=function(operation,key,email)//0 is invite,1 is delete invite
		{
			if(operation==0)
			{
				$scope.inviteValidCheck(key,email);
			}
			else
			{
				firebase.database().ref("Team/"+$scope.tkey).once('value', function(data) {
					var teamData=data.val();
					if(typeof(teamData.invite)!="undefined")
					{
						if(teamData.invite.indexOf(email)>-1)
						{
							$scope.deleteInviteRequest(email,key);
						}
						else
						{
							alert("that student not in the invite list");
						}
					}
					else
					{
						alert("that student not in the invite list");
					}
					
				});
				
			}
			
		}

		/*quit team flow*/
		/*
			1.delete the user email for the team array in Team table
			2.delete the entry with the course id (key) in team object in UserAccount table
		*/
		$scope.quitTeam=function()
		{
			firebase.database().ref("Team/"+$scope.tkey).once('value', function(data) 
			{
				var newTeamData=data.val();		
				$scope.removeElementFromArrayByValue($scope.email,newTeamData.member);
				firebase.database().ref("Team/"+$scope.tkey).set(newTeamData);
			});
			userAccount.orderByChild("email").equalTo($scope.email).on("child_added", function(data)
			{
				var newUserData=data.val();	
				delete newUserData.team[$scope.ckey];
				if(jQuery.isEmptyObject(newUserData.team))
				{
					delete newUserData["team"];
				}
				firebase.database().ref("UserAccount/"+data.getKey()).set(newUserData).then(function()
				{		
					$window.location.href="index.html";		
				});
			});
			
		}
		//delete all the data that related to the team waiting request
		$scope.deleteAllWaitingList=function(teamData)
		{
			
			if(typeof(teamData.request)!="undefined")
			{
				
				for(i=0;i<teamData.request.length;i++)
				{
					var email=teamData.request[i];
					userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
					{
						$scope.requestHandler(1,1,email,data.getKey());
					});
				}
			}
		
		}
		
		 $scope.deleteAllTeamMember=function(teamData)
		{
			for(i=0;i<teamData.member.length;i++)
			{
				var email=teamData.member[i];
				userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
				{
					$scope.deleteMember(1,email,data.getKey());
				});
			}
		}
		$scope.deleteAllInviteList=function(teamData)
		{
			if(typeof(teamData.invite)!="undefined")
			{
				for(i=0;i<teamData.invite.length;i++)
				{
					var email=teamData.invite[i];
					userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
					{
						$scope.deleteInviteRequest(data.val().email,data.getKey());
					});
				}
				
			}
			
		}
		
		$scope.deleteTeam=function()
		{

			firebase.database().ref("Team/"+$scope.tkey).once('value', function(data) {

				var teamData=data.val();				
				
				$.when($scope.deleteAllTeamMember(teamData)).done(function(){
					$.when($scope.deleteAllWaitingList(teamData)).done(function() 
					{
						$.when($scope.deleteAllInviteList(teamData)).done(function()
						{
							firebase.database().ref("Team/"+$scope.tkey).remove();
							firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) 
							{
								var newCourseData=data.val();		
								$scope.removeElementFromArrayByValue($scope.tkey,newCourseData.team);
								firebase.database().ref("courses/"+$scope.ckey).set(newCourseData).then(function(){
									$window.location.href="index.html";		
								});
							});
							
						});
						
					});

				});
				
		
			});
			
		}
		
		$scope.deleteMember=function(operation,email,memberID)
		{

			if(operation==0&&$scope.tLeaderID==email)
			{
				alert("you can't delete the owner")
			}
			else
			{
				if(operation==0)
				{
					firebase.database().ref("Team/"+$scope.tkey).once('value', function(data) 
					{
						var newTeamData=data.val();		
						$scope.removeElementFromArrayByValue(email,newTeamData.member);
						firebase.database().ref("Team/"+$scope.tkey).set(newTeamData);
					});
				}

				firebase.database().ref("UserAccount/"+memberID).once('value', function(data) 
				{
					var newUserData=data.val();
					delete newUserData.team[$scope.ckey];
											
					if(jQuery.isEmptyObject(newUserData.team))
					{
						delete newUserData["team"];
					}
					
					firebase.database().ref("UserAccount/"+memberID).set(newUserData);
					
				});	
				if(operation==0)
				{
					$scope.removeUserList($scope.teamMember,memberID);
				}
				
			}

		}
		
		$scope.requestHandler=function(operation,type,email,waitingID)
		{
				
			firebase.database().ref("Team/"+$scope.tkey).once('value', function(data) 
			{
				var newTeamData=data.val();		
				if(operation==0)//0 is accept
				{								
					var maxSize=$scope.currCourse.max;
					var memberNumber=newTeamData.member.length;
					if(memberNumber+1<=maxSize)
					{
						$scope.removeElementFromArrayByValue(email,newTeamData.request);
						newTeamData.member.push(email);

						firebase.database().ref("Team/"+$scope.tkey).set(newTeamData).then(function()
						{
							
							firebase.database().ref("UserAccount/"+waitingID).once('value', function(data) 
							{
								var newUserData=data.val();
								$scope.removeElementFromArrayByValue($scope.tkey,newUserData.request[$scope.ckey]);
								if(typeof(newUserData.team)=="undefined")
								{
									newUserData.team={};
								}
								newUserData.team[$scope.ckey]=$scope.tkey
																								
								$.when($scope.deleteAllUserInvitedRequest(newUserData)).done(function()
								{
									
									$.when($scope.deleteAllJoiningRequest(newUserData)).done(function()
									{
										if(typeof(newUserData.request)!="undefined"&&typeof(newUserData.request[$scope.ckey])!="undefined")
										{
											delete newUserData.request[$scope.ckey];
											if(jQuery.isEmptyObject(newUserData.request))
											{
												delete newUserData["request"];
											}											
										}
										if(typeof(newUserData.invite)!="undefined"&&typeof(newUserData.invite[$scope.ckey])!="undefined")
										{
											delete newUserData.invite[$scope.ckey];
											if(jQuery.isEmptyObject(newUserData.invite))
											{
												delete newUserData["invite"];
											}											
										}									
										firebase.database().ref("UserAccount/"+waitingID).set(newUserData).then(function()
										{
											$scope.renderTeamInfo(1);	
											
										});
									});	
								});		
							});
						});
			

					}
					else
					{
						alert("exceed max limitation");
					}
					
				}
				else
				{

					$scope.removeElementFromArrayByValue(email,newTeamData.request);
					firebase.database().ref("Team/"+$scope.tkey).set(newTeamData);				
					
					firebase.database().ref("UserAccount/"+waitingID).once('value', function(data) 
					{
						var newUserData=data.val();		
						$scope.removeElementFromArrayByValue($scope.tkey,newUserData.request[$scope.ckey]);
						firebase.database().ref("UserAccount/"+waitingID).set(newUserData);
					});

					if(type==0)
					{
						$scope.updateUserList(newTeamData);
					}
				}
		
			});
		}
		
		$scope.deleteAllJoiningRequest=function(userData)
		{
			if(typeof(userData.request!="undefined")&&typeof(userData.request[$scope.ckey])!="undefined")
			{
				for(i=0;i<userData.request[$scope.ckey].length;i++)
				{
					firebase.database().ref("Team/"+userData.request[$scope.ckey][i]).once('value', function(data) {

						var teamData=data.val();
						$scope.removeElementFromArrayByValue(userData.email,teamData.request);
						firebase.database().ref("Team/"+data.getKey()).set(teamData);
					
					});
				}
			}	
		}
		
		$scope.deleteAllUserInvitedRequest=function(userData)
		{
			if(typeof(userData.invite)!="undefined"&&typeof(userData.invite[$scope.ckey])!="undefined")
			{
				for(i=0;i<userData.invite[$scope.ckey].length;i++)
				{
					firebase.database().ref("Team/"+userData.invite[$scope.ckey][i]).once('value', function(data) {
						var teamData=data.val();
						$scope.removeElementFromArrayByValue(userData.email,teamData.invite);
						firebase.database().ref("Team/"+data.getKey()).set(teamData);	
					});
				}
			}
		}

		$scope.updateUserList=function(newTeamData)
		{
			var tmpMember=[];
			var tmpWaiting=[];
			for(i=0;i<newTeamData.member.length;i++)
			{
				$scope.userObjectArrayPush(newTeamData.member[i],tmpMember);
			}
			$scope.teamMember=tmpMember;
			if(typeof(newTeamData.request.length)!="undefined")
			{
				for(i=0;i<newTeamData.request.length;i++)
				{
					$scope.userObjectArrayPush(newTeamData.request[i],tmpWaiting);
				}
			}

			$scope.waitingList=tmpWaiting;
		}
		
		 $scope.removeUserList=function(array,userID)
		{
			for(i=0;i<array.length;i++)
			{
				if(array[i].key==userID)
				{
					array.splice(i, 1);
					break;
				}
			}
		}
		
		 $scope.removeElementFromArrayByValue=function(value,array)
		{
			array.splice(array.indexOf(value), 1);
		}
		
		 $scope.userObjectArrayPush=function(email,array)
		{
			userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
			{
				array.push({"key":data.getKey(),"data":data.val()});
			});
				
		}
		
		$scope.loadStudentList=function(key)
		{
			firebase.database().ref("courses/"+key).once('value', function(data) {
				var tmp=[];
				var courseData=data.val();
				for(i=0;i<courseData.student.length;i++)
				{
					$scope.userObjectArrayPush(courseData.student[i],tmp);
				}
				$scope.studentList=tmp;		
			});	
		}
		
		$scope.loadInviteList=function(teamData)
		{
			var tmp=[];
			if(typeof(teamData.invite)!="undefined")
			{
				for(i=0;i<teamData.invite.length;i++)
				{
					$scope.userObjectArrayPush(teamData.invite[i],tmp);
				}
			}
			$scope.inviteList=tmp;
			$scope.$apply();
		}
		
		$scope.loadWaitingList=function(teamData)
		{
			var tmp=[];
			if(typeof(teamData.request)!="undefined")
			{
				for(i=0;i<teamData.request.length;i++)
				{

					$scope.userObjectArrayPush(teamData.request[i],tmp);
				}
			}
			$scope.waitingList=tmp;
			$scope.$apply();
		}
		
		$scope.loadTeamMember=function(teamData)
		{
			var tmp=[];
			for(i=0;i<teamData.member.length;i++)
			{
				
				$scope.userObjectArrayPush(teamData.member[i],tmp);
			}
			$scope.teamMember=tmp;
			$scope.$apply();
		}
		
		$scope.renderTeamInfo=function(flag)
		{
			firebase.database().ref("Team/"+$scope.team[$scope.ckey]).once('value', function(data) {
	

				var teamData=data.val();
				if(flag==0)
				{
					$scope.tkey=data.getKey();
					$scope.tLeaderID=data.val().leaderID;
					if($scope.tLeaderID==$scope.email)
					{
						$scope.isOwner=true;
					}
					else
					{
						$scope.isOwner=false;
					}
				}
		
				$scope.loadTeamMember(teamData);
				$scope.loadWaitingList(teamData);
				$scope.loadInviteList(teamData);
				//$scope.loadStudentList($scope.ckey);
			});
			
		}
		
		$scope.roleAccessCheck=function()
		{
			if($scope.role=="0")
			{
				if(typeof($scope.team)=="undefined"||!$scope.team.hasOwnProperty($scope.currCourse.key) )
				{
					console.log("no team in this course");
					$window.location.href="index.html";
				}
				$scope.renderTeamInfo(0);
			}
			else
			{
				if($scope.currCourse.owner!=$scope.email)
				{
					console.log("you are teacher but not the course owner");
					$window.location.href="index.html";
				}
			}
		
		}

		$scope.inviteForm=function()
		{
			$scope.loadStudentList($scope.ckey);
			$.fancybox.open("#studentList");	
		}

		$scope.gup=function( name, url ) {
			if (!url) url = location.href;
			name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
			var regexS = "[\\?&]"+name+"=([^&#]*)";
			var regex = new RegExp( regexS );
			var results = regex.exec( url );
			return results == null ? null : results[1];
		}

		$scope.pathStringCheck=function()
		{
			var invalidSet=['.','#','$','[',']'];
			for(i=0;i<invalidSet.length;i++)
			{
				if($scope.ckey.indexOf(invalidSet[i])>-1)
				{
					return true;
				}
			}
			return false;
		}
		
		$scope.loadcoursesInfo=function()
		{
			$scope.ckey=$scope.gup('c', window.location.href);
			
			if($scope.ckey==null||$scope.ckey==""||$scope.pathStringCheck())
			{
				$scope.doRedirect("index.html");		
			}
			else
			{
				firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) {
					if(data.val()==null)
					{
						console.log("invalid input of course id");
						$scope.doRedirect("index.html");
					}
					else
					{
						$scope.currCourse=data.val();
						$scope.currCourse.key=data.getKey();
						$scope.courseInfo.image=$scope.currCourse.image;
						$scope.roleAccessCheck();						
					}
				});

			}

		}
		
		/**********************************teacher update info********************************************************/
		
				
		File.prototype.convertToBase64 = function(callback){
			var reader = new FileReader();
			reader.onload = function(e) {
				 callback(e.target.result)
			};
			reader.onerror = function(e) {
				 callback(null);
			};        
			reader.readAsDataURL(this);
		};
		
		$scope.fileNameChanged = function (ele) 
		{
		  var file = ele.files[0];
		  if(file.type.length>0&&file.type.substr(0,5)=="image")
		  {
				file.convertToBase64(function(base64){
				$scope.courseInfo.image=base64;
				$scope.fileName=file.name;
				$('#base64PicURL').attr('src',base64);
				$('#base64Name').html(file.name);
				$('#removeURL').show();
				$('#profilePic').val('');
			}); 
			  	  
		  }
		  else
		  {
			  alert("invliad file format");
			//  $scope.removeImg();
			  $('#profilePic').val('');
		  }


		}
		
		$scope.courseInfo=
		{
			title:"",
			image:"",
			owner:"",
			message:"",
			max:"",
			min:"",
			date:""
		}
		$scope.fileName;
		
		$scope.removeImg=function(){
		
			$('#removeURL').hide();
			$('#base64Name').html('');
			$scope.courseInfo.image='image/grey.png';
			$scope.fileName='';
			$('#base64PicURL').attr('src','');

		}
		
		$scope.validInput=function ()
		{
			$scope.courseInfo.title=$scope.currCourse.title;
			$scope.courseInfo.message=$scope.currCourse.message;
			$scope.courseInfo.max=$scope.currCourse.max;
			$scope.courseInfo.min=$scope.currCourse.min;
			$scope.courseInfo.date=$scope.currCourse.date;
			$scope.courseInfo.random=$scope.currCourse.random;
			$scope.courseInfo.owner=$scope.email;
			if(typeof($scope.courseInfo.image)=="undefined"||$scope.courseInfo.image=="")
			{
				$scope.courseInfo.image='image/grey.png';
			}
			
			if(typeof($scope.courseInfo.title)=="undefined"||typeof($scope.courseInfo.message)=="undefined")
			{
				//alert("some missing data");
				return false;
			}
			return true;	
		}
		
		$scope.editCourse = function() {

			if($scope.validInput())
			{
				firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) 
				{
					if(typeof(data.val().team)!="undefined")
					{
						$scope.courseInfo.team=data.val().team;
					}
					
					firebase.database().ref("courses/"+$scope.ckey).set($scope.courseInfo).then(function(){
						
						$window.location.href="index.html";		
						
					});
				});
			
			}else
			{
				alert("some missing data");
			}

		}
		
});