import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import Home from "../screens/Home";
import EditProfile from "../screens/EditProfile";
import AboutApp from "../screens/AboutApp";
import Connection from "../screens/Connections";
import Workorder from "../screens/Workorder";
import Connectiondetails from "../screens/Connectiondetail";
import Profile from "../screens/Profile";
import Employee from "../screens/Employee";
import Employeedetails from "../screens/Employeedetails";
import Contract from "../screens/Contract";
import Contractdetails from "../screens/Contractdetails";
import Tasklist from "../screens/Tasklist";
import Taskdetails from "../screens/Taskdetails";
import ChildContract from "../screens/Childcontract";
import Absencerequest from "../screens/Absencerequest";
import Childcontactdetails from "../screens/Childcontractdetails";
import Leaverequest from "../screens/Leaverequest";
import Switchdate from "../screens/Switchdate";
import Additionalleave from "../screens/Additionalleave";
import Calendercomponent from "../screens/Calendercomponent";
import ChildTime from "../screens/ChildTime";
import ProjectTimeDetails from "../screens/ProjectTimeDetails";
import EmployeeTime from "../screens/EmployeeTime";
import Project from "../screens/Project";
import ProjectDetails from "../screens/ProjectDetails";
import Customer from "../screens/Customer";
import Payorder from "../screens/Payorder";
import Payjob from "../screens/Payjob";
import AddTask from "../screens/AddTask";
import Timeline from "../screens/Timeline";
import ProjectTime from "../screens/ProjectTime";
import Details from "../screens/Details";
import CalendarSlide from "../screens/CalendarSlide";
import BookingList from "../screens/BookingList";
import BookingListDetails from "../screens/BookingListDetails";
import { Alert, BackHandler } from "react-native";
import { t } from "i18next";
import { useFocusEffect } from "@react-navigation/native";
import ScannerDetails from "../screens/ScannerDetails";
import EventList from "../screens/EventList";
import EventDetails from "../screens/EventDetails";
import MyBookings from "../screens/MyBookings";
import MyBookingsDetails from "../screens/MyBookingsDetails";
import AllPastBooking from "../screens/AllPastBooking";

const Stack = createNativeStackNavigator();

export const TimelineScreen = () => {
  return (
    <>
      <Stack.Navigator
        initialRouteName="Timeline"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Timeline" component={Timeline} />
      </Stack.Navigator>
    </>
  );
};

export const TimelinecalanderScreen = () => {
  return (
    <>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="CalendarSlide" component={CalendarSlide} />
        <Stack.Screen name="Taskdetails" component={Taskdetails} />
        <Stack.Screen name="Details" component={Details} />
      </Stack.Navigator>
    </>
  );
};



export const MenuScreen = () => {

  return (
    <>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="AboutApp" component={AboutApp} />
        <Stack.Screen name="Connection" component={Connection} />
        <Stack.Screen name="Workorder" component={Workorder} />
        <Stack.Screen name="Connectiondetails" component={Connectiondetails} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Employee" component={Employee} />
        <Stack.Screen name="Employeedetails" component={Employeedetails} />
        <Stack.Screen name="Contract" component={Contract} />
        <Stack.Screen name="Contractdetails" component={Contractdetails} />
        <Stack.Screen name="Tasklist" component={Tasklist} />
        <Stack.Screen name="Taskdetails" component={Taskdetails} />
        <Stack.Screen name="ChildContract" component={ChildContract} />
        <Stack.Screen
          name="Childcontactdetails"
          component={Childcontactdetails}
        />
        <Stack.Screen name="Absencerequest" component={Absencerequest} />
        <Stack.Screen name="Leaverequest" component={Leaverequest} />
        <Stack.Screen name="Switchdate" component={Switchdate} />
        <Stack.Screen name="Additionalleave" component={Additionalleave} />
        <Stack.Screen name="Calendercomponent" component={Calendercomponent} />
        <Stack.Screen name="ChildTime" component={ChildTime} />
        <Stack.Screen name="ProjectTime" component={ProjectTime} />
        <Stack.Screen name="EmployeeTime" component={EmployeeTime} />
        <Stack.Screen name="Project" component={Project} />
        <Stack.Screen name="ProjectDetails" component={ProjectDetails} />
        <Stack.Screen name="Customer" component={Customer} />
        <Stack.Screen name="Payorder" component={Payorder} />
        <Stack.Screen name="Payjob" component={Payjob} />
        <Stack.Screen name="AddTask" component={AddTask} />
        <Stack.Screen name="Details" component={Details} />
        <Stack.Screen name="BookingList" component={BookingList} />
        <Stack.Screen name="BookingListDetails" component={BookingListDetails} />
        <Stack.Screen name="ScannerDetails" component={ScannerDetails} />
        <Stack.Screen name="EventList" component={EventList} />
        <Stack.Screen name="EventDetails" component={EventDetails} />
        <Stack.Screen name="MyBookings" component={MyBookings} />
        <Stack.Screen name="MyBookingsDetails" component={MyBookingsDetails} />
        <Stack.Screen name="AllPastBooking" component={AllPastBooking} />
      </Stack.Navigator>
    </>
  );
};
export const TaxiBokking = () => {
  return (
    <>
      <Stack.Navigator
        initialRouteName="BookingList"
        screenOptions={{ headerShown: false }}
      >

        <Stack.Screen name="BookingList" component={BookingList} />
        <Stack.Screen name="BookingListDetails" component={BookingListDetails} />
      </Stack.Navigator>
    </>
  );
};



