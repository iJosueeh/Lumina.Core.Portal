import { Observable } from 'rxjs';
import { Material, MaterialInput } from '../models/material.model';

export abstract class MaterialRepository {
    abstract getMaterialsByCourse(courseId: string): Observable<Material[]>;
    abstract uploadMaterial(material: MaterialInput): Observable<Material>;
    abstract updateMaterial(materialId: string, material: Partial<MaterialInput>): Observable<Material>;
    abstract deleteMaterial(materialId: string): Observable<void>;
    abstract toggleVisibility(materialId: string, visible: boolean): Observable<void>;
}
