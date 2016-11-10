	var app = angular.module("addStudentApp", ["firebase"]); 
	
	app.controller("addStudentCtrl", function($scope,$firebaseArray) {
		
		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courseFB=$firebaseArray(courses);
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userFB=$firebaseArray(userAccount);
		

	$scope.studentArray=[];	
	$scope.courseSelect="";
	$scope.studentSelect="";

	$scope.addStudent=function()
	{	
		if($scope.courseSelect==""||$scope.studentSelect=="")
		{
			alert("some input missed");
			return;
		}
		var emailType=$scope.studentSelect.substr($scope.studentSelect.length-1,$scope.studentSelect.length);
		if(emailType==1)
		{
			alert("you should only choose student");
			return;
		}

		var pos=$scope.courseSelect.indexOf('[');
		var courseName=$scope.courseSelect.substr(0,pos);
		var courseKey=$scope.courseSelect.substr(pos+1,100);
		var courseKey=courseKey.substr(0,courseKey.length-1);
		
		pos=$scope.studentSelect.indexOf('^');
		var userKey=$scope.studentSelect.substr(0,pos);
		var email=$scope.studentSelect.substr(userKey.length+1,100).trim();
		var email=email.substr(0,email.length-1).trim();

		userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
		{
			var newUserData=data.val();
			
			if(typeof(newUserData.course)=="undefined")
			{
				newUserData.course=[];
			}
			newUserData.course.push(courseKey);
			firebase.database().ref("UserAccount/"+userKey).set(newUserData);
			location.reload();
		});
	}
	
});

