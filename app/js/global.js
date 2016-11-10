// inject firebase service
var app = angular.module("teamforming", ["firebase"]); 


app.value('user', {
    email: '',
	role:'',
	userName:'',
	key:'',
	course:[],
	team:[]
});

app.controller("wrapperCtrl", function($scope,$rootScope,user) {
		
			$rootScope.$on("updataEmailCall", function(){
			   $scope.updataEmail();
				$rootScope.$emit("updateRole", {});
			});
						
			
			$scope.updataEmail=function()
			{
				$scope.email=user.email;
				$scope.userName=user.userName;
				
			}
			$scope.logout = function() {
				firebase.auth().signOut().then(function() {
				  console.log('Signed Out');
				}, function(error) {
				  console.error('Sign Out Error', error);
				});
			window.location = "login.html";
			}
			
});
app.controller("dashBoardCtrl", function($scope,$rootScope,user, $firebaseArray) {

		// sync with firebaseArray
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userAccount = $firebaseArray(userAccount);

		function getUserInfo(email)
		{	

			userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
			{

				//set user email to global
				user.email=data.val().email;
				user.role=data.val().role;
				user.userName=data.val().userName;
				user.key=data.getKey();
				user.course=data.val().course;
				user.team=data.val().team;
				
				$rootScope.$emit("updataEmailCall", {});	
				
				if(user.role=="0")
				{
					console.log("you are logined as studnet");
				}
				else
				{
					console.log("you are logined as teacher");	
				}
			});

		}
	
		function isLogined()
		{	
			firebase.auth().onAuthStateChanged(function(user) {
			  if (user) 
			  {
				// User is signed in.
				getUserInfo(user.email);

			  }
			  else
			  {
				  window.location = "login.html";
			  }
			});
		}
		
		var init=function()
		{
			isLogined();
		};
		init();
		
	});
	
app.controller("createCoursesCtrl", function($scope,$rootScope,user, $firebaseArray) {
		
		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courses = $firebaseArray(courses);
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userAccount = $firebaseArray(userAccount);
		
		function redirect()
		{
			if($scope.role!="1")
			{
				 window.location = "index.html";
			}
			
		}
		
		$scope.updateRole=function()
		{
			$scope.email=user.email;
			$scope.role=user.role;
			$scope.userName=user.userName;
			$scope.key=user.key;
		}
	
		$rootScope.$on("updateRole", function(){
			   $scope.updateRole();
				redirect();

		});
		

		/*create course functions*/
		
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
			  $scope.removeImg();
			  $('#profilePic').val('');
		  }


		}
		
		$scope.courseInfo=
		{
			title:"",
			image:"image/grey.png",
			owner:"",
			message:"",
			max:"",
			min:""
		}
		$scope.fileName;
		
		$scope.removeImg=function(){
		
			$('#removeURL').hide();
			$('#base64Name').html('');
			$scope.courseInfo.image='image/grey.png';
			$scope.fileName='';
			$('#base64PicURL').attr('src','');

		}
		
		function validInput()
		{
			if($scope.courseInfo.title==""||$scope.courseInfo.message==""||$scope.courseInfo.min==""||$scope.courseInfo.max=="")
			{
				console.log("some missing data");
				return false;
			}
			return true;	
		}
		
		$scope.createCourse = function() {
			var isError=false;
			if(validInput())
			{
				$scope.courseInfo.owner=$scope.email;
			
				$scope.courses.$add($scope.courseInfo).then(function(){
					var courseArray=[];
					courses.orderByChild("owner").equalTo($scope.email).on("child_added", function(data)
					{
						courseArray.push(data.getKey());

						firebase.database().ref("UserAccount/"+$scope.key).once('value', function(data) {
				
							var newUserData=data.val();
							newUserData.course=courseArray;
							firebase.database().ref("UserAccount/"+$scope.key).set(newUserData);
						});						
						isError=false;
					});

				}, function(error) {
				  isError=true;
				  alert("some error occur");
				  console.error(error);
				}).then(function(){
					
					if(!isError)
					{
						 window.location = "index.html";
					}			
				});		
				
			}

		}

	});
	
	
app.controller("indexCtrl", function($scope,$rootScope,user,$firebaseArray,$window) {
		
		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courseFB=$firebaseArray(courses);
		var userAccount = firebase.database().ref("UserAccount");
	
		$scope.updateRole=function()
		{
			$scope.email=user.email;
			$scope.role=user.role;
			$scope.userName=user.userName;
			$scope.key=user.key;
			$scope.course=user.course;
			$scope.team=user.team;
		}
		$scope.courseArray=[];
	
		$rootScope.$on("updateRole", function(){
			   $scope.updateRole();
			   loadcourses();
		});
		
		
		//redirect the page when user click on "view detail"
		//student without team -> teamsearch
		//others -> teampannel
		
		function teamChecking(key)
		{
			if(typeof($scope.team)=="undefined")
			{
				console.log("not hv any team yet");
				return true;
			}
			else
			{
			
				if($scope.team.hasOwnProperty(key) )
				{
					console.log("has team in this course");
					return false;
				}
				else
				{
					console.log("no team in this course");
					return true;
				}
			}
			
		}
		
		$scope.dashBoardChangePage=function(key)
		{

			if(user.role=="0" && teamChecking(key))
			{
				$window.location.href="teamSearch.html?c="+key;
				
			}else
			{
				$window.location.href="teamPanel.html?c="+key;
			}
			
		}
		
		function loadcourses()
		{
			if(typeof($scope.course)!="undefined")
			{
				$scope.courseArray=[];
				for(i=0;i<$scope.course.length;i++)
				{
					firebase.database().ref("courses/"+$scope.course[i]).once('value', function(data) {
						$scope.courseArray.push({"key":data.getKey(),"data":data.val()});	
						
					});
				}
			}
		}		
});



app.controller("teamSearchCtrl", function($scope,$rootScope,user,$firebaseArray,$window) {
		
		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courseFB=$firebaseArray(courses);
		var team = firebase.database().ref("Team");
		$scope.teamInfo = $firebaseArray(team);
		
		
		//team filter variables
		$scope.query = {}
		$scope.searchBy = '$'
		$scope.orderProp="name";   
	
		$scope.updateRole=function()
		{
			$scope.email=user.email;
			$scope.role=user.role;
			$scope.userName=user.userName;
			$scope.key=user.key;
			$scope.course=user.course;
			$scope.team=user.team;
		}
		
		$scope.ckey="";
	
		$scope.currCourse={};
		
		$scope.newTeam=
		{
			name:"",
			description:"",
			leaderID:"",
			member:[],
			courseID:""
		};

		$scope.existedTeam=[];

		$rootScope.$on("updateRole", function(){
			   $scope.updateRole();
			   loadcoursesInfo();
		});
		
		
		$scope.joinRequest=function(key)
		{
			//team request list
			var isExisted=false;
			firebase.database().ref("Team/"+key).once('value', function(data) 
			{
			
				var newTeamData=data.val();
				
				if(typeof(data.val().request)=="undefined")
				{
					var request=[];
					request.push($scope.email);
					newTeamData.request=request;
				}
				else
				{
					if(data.val().request.indexOf($scope.email)>-1)
					{
						console.log("you are alerady in the waiting list");
						isExisted=true;
						return;
					}
					else
					{
						newTeamData.request.push($scope.email);
					}
				}
				firebase.database().ref("Team/"+key).set(newTeamData);
			});
	
			//user "coursekey":request team array
			if(!isExisted)
			{
				firebase.database().ref("UserAccount/"+$scope.key).once('value', function(data) {
					var newUserData=data.val();

					if(typeof(data.val().request)=="undefined")
					{
						var request={};
						var teamArray=[];
						teamArray.push(key);
						request[$scope.currCourse.key]=teamArray;
						newUserData.request=request;
					
					}else
					{					
						newUserData.request[[$scope.currCourse.key]].push(key);
					}

					firebase.database().ref("UserAccount/"+$scope.key).set(newUserData);
				});
			}
			
		}

		function gup( name, url ) {
			if (!url) url = location.href;
			name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
			var regexS = "[\\?&]"+name+"=([^&#]*)";
			var regex = new RegExp( regexS );
			var results = regex.exec( url );
			return results == null ? null : results[1];
		}

		
		function loadcoursesInfo()
		{
			
			$scope.ckey=gup('c', window.location.href);
			
			if($scope.ckey==null||$scope.ckey=="")
			{
				$window.location.href="index.html";		
			}
			else
			{
				if(typeof($scope.team)!="undefined"&&$scope.team.hasOwnProperty($scope.ckey))
				{
					$window.location.href="teamPanel.html?c="+$scope.ckey;			
				}
				else
				{
					firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) {
						if(data.val()==null)
						{
							console.log("invalid input of course id");
							$window.location.href="index.html";
						}
						else
						{
							$scope.currCourse=data.val();
							$scope.currCourse.key=data.getKey();
							loadExistedTeam();							
						}
					});
				}

			}

		}
		
		
		function loadExistedTeam()
		{
			for(i=0;i<$scope.currCourse.team.length;i++)
			{
				
				firebase.database().ref("Team/"+$scope.currCourse.team[i]).once('value', function(data) {
					$scope.existedTeam.push({"key":data.getKey(),"data":data.val()});					
				});
			}
			
			
		}
		
		$scope.createTeamForm=function()
		{
			$("#teamForm").find('input[type="text"]').val('');
			$("#teamForm").find('textarea').val('');
			$.fancybox.open("#teamForm");	
		}
		
		function validCheck()
		{
			
			if($scope.newTeam.name.trim()!=""&&$scope.newTeam.description.trim()!="")
			{
				return true;
			}
			return false;
		}
		
		$scope.createTeam=function()
		{
			if(validCheck())
			{

				$scope.newTeam.leaderID=$scope.email;
				$scope.newTeam.member.push($scope.email);
				$scope.newTeam.courseID=$scope.currCourse.key;

				$scope.teamInfo.$add($scope.newTeam).then(function(data)
				{
					
					if(typeof($scope.team)=="undefined")
					{
						$scope.team={};
					}
					$scope.team[$scope.currCourse.key]=data.getKey();
				
				
					firebase.database().ref("UserAccount/"+$scope.key).once('value', function(data) {
			
						var newUserData=data.val();
						newUserData.team=$scope.team;
						firebase.database().ref("UserAccount/"+$scope.key).set(newUserData);
					});

		
					if(typeof($scope.currCourse.team)=="undefined")
					{
						$scope.currCourse.team=[];
						$scope.currCourse.team.push(data.getKey());
					}
					else
					{
						$scope.currCourse.team.push(data.getKey());
					}
						
					var newCourseData=$scope.currCourse;
					delete newCourseData.key;
					firebase.database().ref("courses/"+$scope.ckey).set(newCourseData).then(function(){
						$window.location.href="teamPanel.html?c="+$scope.ckey;
						
					});
				
					
				});
			}
			else
			{
				console.log("some data missed");
			}
			
		}
				
});



app.controller("teamPanelCtrl", function($scope,$rootScope,user,$firebaseArray,$window) {
		
		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courseFB=$firebaseArray(courses);
		
		var team = firebase.database().ref("Team");
		$scope.teamFB=$firebaseArray(team);
		
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userAccount = $firebaseArray(userAccount);

	
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
		$scope.joinedTeam={};
		$scope.teamMember=[];
		$scope.waitingList=[];
		$scope.ckey;
		
		$rootScope.$on("updateRole", function(){
			   $scope.updateRole();
			   loadcoursesInfo();
			   
		});
		
		$scope.requestHandler=function(operation,email,waitingID)
		{
		
console.log("waiting",waitingID);
		
			if(operation==0)
			{
				console.log("accept");

				var memberNumber=$scope.joinedTeam.member.length;
				if(memberNumber+1<=$scope.currCourse.max)
				{
					firebase.database().ref("Team/"+$scope.joinedTeam.key).once('value', function(data) 
					{
						var newTeamData=data.val();		
						newTeamData.request.splice(newTeamData.request.indexOf(email), 1);
						newTeamData.member.push(email);
						firebase.database().ref("Team/"+$scope.joinedTeam.key).set(newTeamData);
					});

					firebase.database().ref("UserAccount/"+waitingID).once('value', function(data) 
					{
						var newUserData=data.val();
						removeElementFromArrayByValue($scope.joinedTeam.key,newUserData.request[$scope.ckey]);
						if(typeof(newUserData.team)=="undefined")
						{
							newUserData.team={};
						}
						newUserData.team[$scope.ckey]=$scope.joinedTeam.key
						
						firebase.database().ref("UserAccount/"+waitingID).set(newUserData);
						if(typeof(newUserData.request!="undefined"))
						{
							console.log(newUserData.request);
							for(i=0;i<newUserData.request[$scope.ckey].length;i++)
							{
								firebase.database().ref("Team/"+newUserData.request[$scope.ckey][i]).once('value', function(data) {

									var newTeamData=data.val();
									removeElementFromArrayByValue(newUserData.email,newTeamData.request);
									firebase.database().ref("Team/"+data.getKey()).set(newTeamData);
									
								});
							}
						}

						
					});				

				}
				else
				{
					alert("exceed max limitation");
				}
				
				userObjectArrayPush(email,$scope.teamMember);
				removeWaitingList(waitingID);
				

			}
			else
			{
				console.log("Decline");
				firebase.database().ref("Team/"+$scope.joinedTeam.key).once('value', function(data) 
				{
					var newTeamData=data.val();		
					removeElementFromArrayByValue(email,newTeamData.request);
					firebase.database().ref("Team/"+$scope.joinedTeam.key).set(newTeamData);
				});

				console.log(waitingID);
				
				firebase.database().ref("UserAccount/"+waitingID).once('value', function(data) 
				{
					var newUserData=data.val();		
					removeElementFromArrayByValue($scope.joinedTeam.key,newUserData.request[$scope.ckey]);
					firebase.database().ref("UserAccount/"+waitingID).set(newUserData);
				});
				removeWaitingList(waitingID);
				
			}
		}
		
		function removeWaitingList(waitingID)
		{
			for(i=0;i<$scope.waitingList.length;i++)
			{
				if($scope.waitingList[i].key==waitingID)
				{
					$scope.waitingList.splice(i, 1);
					break;
				}
			}
		}
		
		function removeElementFromArrayByValue(value,array)
		{
			array.splice(array.indexOf(value), 1);
		}
		
		function userObjectArrayPush(email,array)
		{
			userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
			{
				array.push({"key":data.getKey(),"data":data.val()});
			});
				
		}
		
		
		function renderTeamInfo()
		{
			firebase.database().ref("Team/"+$scope.team[$scope.ckey]).once('value', function(data) {
	
				$scope.joinedTeam=data.val();
				$scope.joinedTeam.key=data.getKey();
				
				for(i=0;i<$scope.joinedTeam.member.length;i++)
				{
					
					/*userAccount.orderByChild("email").equalTo($scope.joinedTeam.member[i]).on("child_added", function(data)
					{
						$scope.teamMember.push({"key":data.getKey(),"data":data.val()});
					});*/
					userObjectArrayPush($scope.joinedTeam.member[i],$scope.teamMember);
				}
				if(typeof($scope.joinedTeam.request)!="undefined")
				{
					for(i=0;i<$scope.joinedTeam.request.length;i++)
					{
						/*userAccount.orderByChild("email").equalTo($scope.joinedTeam.request[i]).on("child_added", function(data)
						{
							$scope.waitingList.push({"key":data.getKey(),"data":data.val()});
						});*/
						userObjectArrayPush($scope.joinedTeam.request[i],$scope.waitingList);
					}
				}

				
			});
			
		}
		
		function roleAccessCheck()
		{
			if($scope.role=="0")
			{
				if(typeof($scope.team)=="undefined"||!$scope.team.hasOwnProperty($scope.currCourse.key) )
				{
					console.log("no team in this course");
					$window.location.href="index.html";
				}
			}
			else
			{
				if($scope.currCourse.owner!=$scope.email)
				{
					console.log("you are teacher but not the course owner");
					$window.location.href="index.html";
				}
			}
			renderTeamInfo();
		}

		function gup( name, url ) {
			if (!url) url = location.href;
			name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
			var regexS = "[\\?&]"+name+"=([^&#]*)";
			var regex = new RegExp( regexS );
			var results = regex.exec( url );
			return results == null ? null : results[1];
		}

		
		function loadcoursesInfo()
		{
			$scope.ckey=gup('c', window.location.href);
			
			if($scope.ckey==null||$scope.ckey=="")
			{
				$window.location.href="index.html";		
			}
			else
			{
				firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) {
					if(data.val()==null)
					{
						console.log("invalid input of course id");
						$window.location.href="index.html";
					}
					else
					{
						$scope.currCourse=data.val();
						$scope.currCourse.key=data.getKey();
						roleAccessCheck();						
					}
				});

			}

		}
				
});


