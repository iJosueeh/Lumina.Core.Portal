import { Observable } from 'rxjs';
import { Attendance, AttendanceStats, AttendanceInput, StudentAttendanceSummary } from '../models/attendance.model';

export abstract class AttendanceRepository {
    abstract getAttendanceByCourse(courseId: string): Observable<Attendance[]>;
    abstract getAttendanceByDate(courseId: string, date: Date): Observable<Attendance>;
    abstract getAttendanceStats(courseId: string): Observable<AttendanceStats>;
    abstract getStudentAttendance(courseId: string, studentId: string): Observable<StudentAttendanceSummary>;
    abstract submitAttendance(attendance: AttendanceInput): Observable<Attendance>;
    abstract updateAttendance(attendanceId: string, attendance: AttendanceInput): Observable<Attendance>;
}
