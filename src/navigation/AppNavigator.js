import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ClassManagementScreen from '../screens/ClassManagementScreen';
import SubjectManagementScreen from '../screens/SubjectManagementScreen';
import StudentManagementScreen from '../screens/StudentManagementScreen';
import StaffManagementScreen from '../screens/StaffManagementScreen';
import SubjectStaffManagementScreen from '../screens/SubjectStaffManagementScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import AdminAttendanceDashboard from '../screens/AdminAttendanceDashboard';
import FeeManagementScreen from '../screens/FeeManagementScreen';
import HomeworkScreen from '../screens/HomeworkScreen';
import NoticeScreen from '../screens/NoticeScreen';
import StudentDashboardScreen from '../screens/StudentDashboardScreen';
import StaffDashboardScreen from '../screens/StaffDashboardScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import StaffProfileScreen from '../screens/StaffProfileScreen';
import AssignmentManagementScreen from '../screens/AssignmentManagementScreen';
import TimetableScreen from '../screens/TimetableScreen';
import ExamResultScreen from '../screens/ExamResultScreen';
import UploadTimetableScreen from '../screens/UploadTimetableScreen';
import UploadExamMarksScreen from '../screens/UploadExamMarksScreen';
import ClassMessagesScreen from '../screens/ClassMessagesScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import CreateAnnouncementScreen from '../screens/CreateAnnouncementScreen';
import StudentDetailsScreen from '../screens/StudentDetailsScreen';
import FeesDetailsScreen from '../screens/FeesDetailsScreen';
import ClassAttendanceDetailsScreen from '../screens/ClassAttendanceDetailsScreen';
import SubjectAssignmentScreen from '../screens/SubjectAssignmentScreen';
import StudentHomeworkScreen from '../screens/StudentHomeworkScreen';
import StudentNoticesScreen from '../screens/StudentNoticesScreen';
import IntroScreen from '../screens/IntroScreen';
import colors from '../constants/colors';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Intro"
                screenOptions={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: colors.primary,
                    },
                    headerTintColor: colors.white,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    contentStyle: { backgroundColor: colors.background },
                }}
            >
                <Stack.Screen
                    name="Intro"
                    component={IntroScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ClassManagement"
                    component={ClassManagementScreen}
                    options={{ title: 'Class Management' }}
                />
                <Stack.Screen
                    name="SubjectManagement"
                    component={SubjectManagementScreen}
                    options={{ title: 'Subject Management' }}
                />
                <Stack.Screen
                    name="StudentManagement"
                    component={StudentManagementScreen}
                    options={{ title: 'Student Management' }}
                />
                <Stack.Screen
                    name="StaffManagement"
                    component={StaffManagementScreen}
                    options={{ title: 'staff Management' }}
                />
                <Stack.Screen
                    name="SubjectStaffManagement"
                    component={SubjectStaffManagementScreen}
                    options={{ title: 'Subject staff Assignment' }}
                />
                <Stack.Screen
                    name="Attendance"
                    component={AttendanceScreen}
                    options={{ title: 'Attendance' }}
                />
                <Stack.Screen
                    name="AdminAttendanceDashboard"
                    component={AdminAttendanceDashboard}
                    options={{ title: 'Attendance Dashboard' }}
                />
                <Stack.Screen
                    name="FeeManagement"
                    component={FeeManagementScreen}
                    options={{ title: 'Fee Management' }}
                />
                <Stack.Screen
                    name="Homework"
                    component={HomeworkScreen}
                    options={{ title: 'Homework' }}
                />
                <Stack.Screen
                    name="Notices"
                    component={NoticeScreen}
                    options={{ title: 'Notices' }}
                />
                <Stack.Screen
                    name="StudentDashboard"
                    component={StudentDashboardScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="StaffDashboard"
                    component={StaffDashboardScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="StudentProfile"
                    component={StudentProfileScreen}
                    options={{ title: 'My Profile' }}
                />
                <Stack.Screen
                    name="StaffProfile"
                    component={StaffProfileScreen}
                    options={{ title: 'My Profile' }}
                />
                <Stack.Screen
                    name="AssignmentManagement"
                    component={AssignmentManagementScreen}
                    options={{ title: 'Subject & Class Assignments' }}
                />
                <Stack.Screen
                    name="Timetable"
                    component={TimetableScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ExamResults"
                    component={ExamResultScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="UploadTimetable"
                    component={UploadTimetableScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="UploadExamMarks"
                    component={UploadExamMarksScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ClassMessages"
                    component={ClassMessagesScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Announcements"
                    component={AnnouncementsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="CreateAnnouncement"
                    component={CreateAnnouncementScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="StudentDetails"
                    component={StudentDetailsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="FeesDetails"
                    component={FeesDetailsScreen}
                    options={{ title: 'Fees Details' }}
                />
                <Stack.Screen
                    name="ClassAttendanceDetails"
                    component={ClassAttendanceDetailsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="SubjectAssignment"
                    component={SubjectAssignmentScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="StudentHomework"
                    component={StudentHomeworkScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="StudentNotices"
                    component={StudentNoticesScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
