import { Component, Input, forwardRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css'
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: string[] = [];
  @Input() selectedOption: string = '';
  @Input() disabled: boolean = false;
  
  onOptionChange = output<string>();

  private _value: any = '';
  onChange: any = () => {};
  onTouched: any = () => {};

  get value() { return this._value; }
  set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      this.onChange(v);
      this.onOptionChange.emit(v);
    }
  }

  writeValue(value: any): void { this._value = value; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
