import * as React from "react";
import { View, StyleSheet, AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/login";
import Otp from "../screens/Otp";
import Home from "../screens/Home";
import Details from "../screens/Details";
import { BottamScreens, MenuScreen } from "./bottam";
import SplashScreen from "../screens/Splash";
import Auth from "../screens/Auth";
import Register from "../screens/Register";
import Selection from "../screens/Selection";
import Staff from "../screens/Staff";
import EditProfile from "../screens/EditProfile";
import Profile from "../screens/Profile";
import { BottamScreens1 } from "./bottom1";
import AboutApp from "../screens/AboutApp";
import Password from "../screens/Password";
import Connectiondetails from "../screens/Connectiondetail";
import Connection from "../screens/Connections";
import Workorder from "../screens/Workorder";
import Employee from "../screens/Employee";
import Employeedetails from "../screens/Employeedetails";
import Select from "../screens/Selectionlan";
import Contract from "../screens/Contract";
import Contractdetails from "../screens/Contractdetails";
import Tasklist from "../screens/Tasklist";
import Taskdetails from "../screens/Taskdetails";
import Childcontactdetails from "../screens/Childcontractdetails";
import ChildContract from "../screens/Childcontract";
import Absencerequest from "../screens/Absencerequest";
import Leaverequest from "../screens/Leaverequest";
import Switchdate from "../screens/Switchdate";
import Additionalleave from "../screens/Additionalleave";
import Calendercomponent from "../screens/Calendercomponent";
import ChildTime from "../screens/ChildTime";
import ProjectTime from "../screens/ProjectTime";
import EmployeeTime from "../screens/EmployeeTime";
import Project from "../screens/Project";
import ProjectDetails from "../screens/ProjectDetails";
import ProjectTimeDetails from "../screens/ProjectTimeDetails";
import Customer from "../screens/Customer";
import Payorder from "../screens/Payorder";
import AddTask from "../screens/AddTask";
import TaskMultipalUser from "../screens/TaskMultipalUser";
import Payjob from "../screens/Payjob";
import Timeline from "../screens/Timeline";
import AddNweTask from "../screens/addNweTask";
import GoBackContext from "../constants/GoBackContext";
import GoogleAddress from "../components/googleAddress";
import Ticket from "../screens/Ticket";
import MyCompany from "../screens/MyCompany";
import AddCompany from "../screens/AddCompany";
import AddRelations from "../screens/AddRelations";
import CompanyLogin from "../screens/LoginFlow/CompanyLogin";
import NewPassword from "../screens/LoginFlow/NewPassword";
import NewOtp from "../screens/LoginFlow/NewOtp";
import NewStaff from "../screens/LoginFlow/NewStaff";
import CustomCamera from "../components/CustomCamera";
import EcommerceTemplate from "../screens/EcommerceTemplate";
import LayoutHeader from "../components/_LayoutToast";
import EcommerceTemplateDetails from "../screens/EcommerceTemplateDetails";
import OTAUpdatePopup from "../components/OTAUpdatePopup";
import EventBookingList from "../screens/EventBookingList";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { Colors } from "../constants/color";
import EventGuestList from "../screens/EventGuestList";
import { requestPermission } from "../notification/requestPermission";
import messaging from '@react-native-firebase/messaging';
import { navigationRef } from "../navigationRef/navigationRef";
import useForegroundnotification from "../hooks/useForegroundnotification";
import {
  getStoredNotificationData,
  handleNotificationPress,
  retryStoredNotificationNavigation,
  sanitizeNotificationData,
} from "../utils/notificationNavigation";
import { bringAppToForeground } from "../utils/nativeNotification";
import CreateTicket from "../../newSRC/screens/Ticket/CreateTicket";
import AllTicket from "../../newSRC/screens/Ticket/AllTicket";
import TicketDetails from "../../newSRC/screens/Ticket/TicketDetails";
import { AppDataProvider } from "../../newSRC/context/AppDataContext";
const Stack = createNativeStackNavigator();

const withLayoutHeader = (Component) => {
  const Wrapped = (props) => (
    <LayoutHeader>
      <Component {...props} />
    </LayoutHeader>
  );
  Wrapped.displayName = `WithLayoutHeader(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
};

const Screens = () => {
  const [splashVisible, setSplashVisible] = React.useState(true);
  const [navigationReady, setNavigationReady] = React.useState(false);
  const coldStartHandledRef = React.useRef(false);
  const pendingNotificationRef = React.useRef(null);
  useForegroundnotification();

  const queueNotificationForLaunch = React.useCallback((data) => {
    const clean = sanitizeNotificationData(data);
    if (Object.keys(clean).length === 0) {
      return;
    }
    pendingNotificationRef.current = clean;
  }, []);

  const resolveColdStartNotification = React.useCallback(async () => {
    if (coldStartHandledRef.current) {
      return;
    }

    coldStartHandledRef.current = true;

    try {
      const firebaseInitial = await messaging().getInitialNotification();
      const firebaseData = firebaseInitial?.data;
      if (firebaseData && Object.keys(firebaseData).length > 0) {
        queueNotificationForLaunch(firebaseData);
        return;
      }

      const storedData = await getStoredNotificationData();
      if (storedData) {
        queueNotificationForLaunch(storedData);
      }
    } catch (error) {
      console.log("Cold start notification error:", error);
    }
  }, [queueNotificationForLaunch]);

  const processPendingNotification = React.useCallback(async () => {
    if (pendingNotificationRef.current) {
      const pendingData = pendingNotificationRef.current;
      pendingNotificationRef.current = null;
      await handleNotificationPress(pendingData);
      return;
    }

    await retryStoredNotificationNavigation();
  }, []);

  React.useEffect(() => {
    resolveColdStartNotification();

    const unsubscribeNotificationOpen = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        bringAppToForeground()
          .then(() => handleNotificationPress(remoteMessage?.data))
          .catch((error) => {
            console.log("Notification open error:", error);
          });
      }
    );

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        retryStoredNotificationNavigation().catch((error) => {
          console.log("Retry notification navigation error:", error);
        });
      }
    });

    const timer = setTimeout(() => {
      setSplashVisible(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      unsubscribeNotificationOpen();
      appStateSubscription.remove();
    };
  }, [resolveColdStartNotification]);

  React.useEffect(() => {
    if (splashVisible || !navigationReady) {
      return;
    }

    processPendingNotification().catch((error) => {
      console.log("Pending notification error:", error);
    });
  }, [splashVisible, navigationReady, processPendingNotification]);

  React.useEffect(() => {
    if (!navigationReady || splashVisible) {
      return;
    }

    retryStoredNotificationNavigation();
  }, [navigationReady, splashVisible]);

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => setNavigationReady(true)}
      >
        <GoBackContext>
          <AppDataProvider>
            <Stack.Navigator
            initialRouteName="Auth"
            screenOptions={{ headerShown: false }}
          >
              <Stack.Screen name="Auth" component={withLayoutHeader(Auth)} />

              <Stack.Screen
                name="Select"
                component={Select}
              />

              <Stack.Screen
                name="Register"
                component={withLayoutHeader(Register)}
              />
              <Stack.Screen name="Otp" component={withLayoutHeader(Otp)} />
              <Stack.Screen
                name="Password"
                component={withLayoutHeader(Password)}
              />
              <Stack.Screen
                name="Timeline"
                component={withLayoutHeader(Timeline)}
              />
              <Stack.Screen
                name="BottamScreens"
                component={withLayoutHeader(Home)}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen
                name="Details"
                component={withLayoutHeader(Details)}
              />
              <Stack.Screen
                name="Selection"
                component={withLayoutHeader(Selection)}
              />
            
              <Stack.Screen name="Staff" component={withLayoutHeader(Staff)} />
              <Stack.Screen
                name="EditProfile"
                component={withLayoutHeader(EditProfile)}
              />
              <Stack.Screen
                name="AboutApp"
                component={withLayoutHeader(AboutApp)}
              />
              <Stack.Screen
                name="Connection"
                component={withLayoutHeader(Connection)}
              />
              <Stack.Screen
                name="Workorder"
                component={withLayoutHeader(Workorder)}
              />
              <Stack.Screen
                name="MenuScreen"
                component={withLayoutHeader(MenuScreen)}
              />
              <Stack.Screen
                name="Connectiondetails"
                component={withLayoutHeader(Connectiondetails)}
              />
              <Stack.Screen
                name="Profile"
                component={withLayoutHeader(Profile)}
              />
              <Stack.Screen
                name="Employee"
                component={withLayoutHeader(Employee)}
              />
              <Stack.Screen
                name="Employeedetails"
                component={withLayoutHeader(Employeedetails)}
              />
              <Stack.Screen
                name="Contract"
                component={withLayoutHeader(Contract)}
              />
              <Stack.Screen
                name="Contractdetails"
                component={withLayoutHeader(Contractdetails)}
              />
              <Stack.Screen
                name="Tasklist"
                component={withLayoutHeader(Tasklist)}
              />
              <Stack.Screen
                name="Taskdetails"
                component={withLayoutHeader(Taskdetails)}
              />
              <Stack.Screen
                name="ChildContract"
                component={withLayoutHeader(ChildContract)}
              />
       
              <Stack.Screen
                name="Childcontactdetails"
                component={withLayoutHeader(Childcontactdetails)}
              />
              <Stack.Screen
                name="Absencerequest"
                component={withLayoutHeader(Absencerequest)}
              />
              <Stack.Screen
                name="Leaverequest"
                component={withLayoutHeader(Leaverequest)}
              />
              <Stack.Screen
                name="Switchdate"
                component={withLayoutHeader(Switchdate)}
              />
              <Stack.Screen
                name="CustomCamera"
                component={withLayoutHeader(CustomCamera)}
              />
              <Stack.Screen
                name="Additionalleave"
                component={withLayoutHeader(Additionalleave)}
              />
              <Stack.Screen
                name="Calendercomponent"
                component={withLayoutHeader(Calendercomponent)}
              />
              <Stack.Screen
                name="ChildTime"
                component={withLayoutHeader(ChildTime)}
              />
              <Stack.Screen
                name="ProjectTime"
                component={withLayoutHeader(ProjectTime)}
              />
              <Stack.Screen
                name="EmployeeTime"
                component={withLayoutHeader(EmployeeTime)}
              />
              <Stack.Screen
                name="Project"
                component={withLayoutHeader(Project)}
              />
              <Stack.Screen
                name="ProjectDetails"
                component={withLayoutHeader(ProjectDetails)}
              />
              <Stack.Screen
                name="Customer"
                component={withLayoutHeader(Customer)}
              />
              <Stack.Screen
                name="Payorder"
                component={withLayoutHeader(Payorder)}
              />
              <Stack.Screen
                name="Payjob"
                component={withLayoutHeader(Payjob)}
              />
              <Stack.Screen
                name="AddTask"
                component={withLayoutHeader(AddTask)}
              />
              <Stack.Screen
                name="AddNweTask"
                component={withLayoutHeader(AddNweTask)}
              />
              <Stack.Screen
                name="BottamScreens1"
                component={withLayoutHeader(BottamScreens1)}
              />
              <Stack.Screen
                name="GoogleAddress"
                component={withLayoutHeader(GoogleAddress)}
              />
              <Stack.Screen
                name="Ticket"
                component={withLayoutHeader(Ticket)}
              />
              <Stack.Screen
                name="CreateTicket"
                component={withLayoutHeader(CreateTicket)}
              />
              <Stack.Screen
                name="AllTicket"
                component={withLayoutHeader(AllTicket)}
              />
              <Stack.Screen
                name="TicketDetails"
                component={withLayoutHeader(TicketDetails)}
              />
              <Stack.Screen
                name="EcommerceTemplate"
                component={withLayoutHeader(
                  withLayoutHeader(EcommerceTemplate)
                )}
              />
              <Stack.Screen
                name="EcommerceTemplateDetails"
                component={withLayoutHeader(
                  withLayoutHeader(EcommerceTemplateDetails)
                )}
              />
              <Stack.Screen
                name="TaskMultipalUser"
                component={withLayoutHeader(TaskMultipalUser)}
              />
              <Stack.Screen
                name="ProjectTimeDetails"
                component={withLayoutHeader(ProjectTimeDetails)}
              />
              <Stack.Screen
                name="MyCompany"
                component={withLayoutHeader(MyCompany)}
              />
              <Stack.Screen
                name="AddCompany"
                component={withLayoutHeader(AddCompany)}
              />
              <Stack.Screen
                name="AddRelations"
                component={withLayoutHeader(AddRelations)}
              />

              <Stack.Screen
                name="CompanyLogin"
                component={withLayoutHeader(CompanyLogin)}
                options={{
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="NewPassword"
                component={withLayoutHeader(NewPassword)}
              />
              <Stack.Screen
                name="NewOtp"
                component={withLayoutHeader(NewOtp)}
              />
              <Stack.Screen
                name="NewStaff"
                component={withLayoutHeader(NewStaff)}
              />
              <Stack.Screen
                name="EventBookingList"
                component={withLayoutHeader(EventBookingList)}
              />
              <Stack.Screen
                name="EventGuestList"
                component={withLayoutHeader(EventGuestList)}
              />

            </Stack.Navigator>
          </AppDataProvider>
          </GoBackContext>
      </NavigationContainer>
      {splashVisible && (
        <View style={styles.splashOverlay}>
          <SplashScreen />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});

export default Screens;
