import { Observable } from 'rxjs';
import { TeacherEvaluation, EvaluationInput, EvaluationStats } from '../models/evaluation.model';

export abstract class EvaluationRepository {
    abstract getEvaluationsByCourse(courseId: string): Observable<TeacherEvaluation[]>;
    abstract getEvaluationById(evaluationId: string): Observable<TeacherEvaluation>;
    abstract getEvaluationStats(evaluationId: string): Observable<EvaluationStats>;
    abstract createEvaluation(evaluation: EvaluationInput): Observable<TeacherEvaluation>;
    abstract updateEvaluation(evaluationId: string, evaluation: Partial<EvaluationInput>): Observable<TeacherEvaluation>;
    abstract deleteEvaluation(evaluationId: string): Observable<void>;
    abstract publishEvaluation(evaluationId: string): Observable<void>;
}
