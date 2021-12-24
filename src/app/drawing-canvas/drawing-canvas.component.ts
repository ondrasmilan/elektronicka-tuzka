import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FileUploadService } from '../file-upload.service';
import { ColorPickerService, Cmyk, Rgba } from 'ngx-color-picker';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-drawing-canvas',
  templateUrl: './drawing-canvas.component.html',
  styleUrls: ['./drawing-canvas.component.scss'],
})
export class DrawingCanvasComponent implements AfterViewInit {
  title = 'Elektronická tužka';
  @ViewChild('canvas', { static: true })
  canvas: ElementRef | undefined;
  @ViewChild('bottom', { static: true })
  bottom: ElementRef | undefined;
  @ViewChild('canvasDiv', { static: true })
  canvasDiv: ElementRef | undefined;
  @ViewChild('button', { static: true })
  button: ElementRef | undefined;
  @ViewChild('main', { static: true })
  main: ElementRef | undefined;
  @ViewChild('inputName', { static: true })
  inputName: ElementRef | undefined;
  @ViewChild('buttonSave', { static: true })
  buttonSave: ElementRef | undefined;
  @ViewChild('saver', { static: true })
  saver: ElementRef | undefined;
  private lineWidth: number = 4;
  private image = new Image();
  private imageLoaded: boolean = false;
  private file: File = new File([], '');
  private destURL: string = '';
  private fileName: string = '';
  private uploaded: boolean = false;
  private outerEl: HTMLElement | null | undefined = null;
  private cx!: CanvasRenderingContext2D | null | undefined;
  private paint: boolean = false;
  private clickX: number[] = [];
  private clickY: number[] = [];
  private clickDrag: boolean[] = [];
  public color: string = '#ff0000';
  public colorValue: string = '#000000';

  constructor(
    private fileUploadService: FileUploadService,
    private cpService: ColorPickerService
  ) {}

  ngAfterViewInit() {
    // get the context
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    this.cx = canvasEl.getContext('2d');

    this.resizeComponent();
    if (!this.cx) throw 'Cannot get context';
    // set some default properties about the line
    this.cx.lineWidth = 4;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = 'red';

    this.resizeComponent();

    this.outerEl = this.main?.nativeElement.parentElement?.parentElement;

    this.redraw();
    this.createUserEvents();
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      this.resizeComponent();
    });
    if (this.outerEl) {
      observer.observe(this.outerEl);
    }
  }

  private hexToRgb(hex: string): Array<number> {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      let r = parseInt(result[1], 16);
      let g = parseInt(result[2], 16);
      let b = parseInt(result[3], 16);
      return [r, g, b]; //return 23,14,45 -> reformat if needed
    }
    return [];
  }

  public onEventLog(event: string, data: any): void {
    if (
      event === 'cpSliderDragEnd' ||
      event === 'cpInputChange' ||
      event === 'cpSliderDragStart'
    ) {
      this.color = data.color;
      let rgb = this.hexToRgb(data.color);
      let gw = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
      if (gw > 90) this.colorValue = '#000000';
      else this.colorValue = '#ffffff';
    }
    console.log(event, data);
  }

  public onChangeColor(color: string): void {
    this.color = color;
  }

  public onChangeUrl(event: any) {
    if (this.uploaded) {
      const buttonEl: HTMLButtonElement = this.button?.nativeElement;
      buttonEl.classList.replace('btn-success', 'btn-primary');
    }
    this.destURL = event.target.value;
    //console.log(this.destURL);
  }

  public onChangeName(event: any) {
    if (this.uploaded) {
      const buttonEl: HTMLButtonElement = this.button?.nativeElement;
      buttonEl.classList.replace('btn-success', 'btn-primary');
    }

    const inputNameEl: HTMLInputElement = this.inputName?.nativeElement;
    inputNameEl.classList.remove('is-invalid');
    this.fileName = event.target.value;
    //console.log(this.fileName);
  }

  public onUpload() {
    if (this.fileName === '') {
      const inputNameEl: HTMLInputElement = this.inputName?.nativeElement;
      inputNameEl.classList.add('is-invalid');
      return;
    }
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    const buttonEl: HTMLButtonElement = this.button?.nativeElement;
    let file: File;
    canvasEl.toBlob((blob) => {
      if (blob) file = new File([blob], this.fileName);
      else throw 'No image';
      //console.log(file);
      var res = this.fileUploadService.upload(file, this.destURL).subscribe(
        (x) => {
          console.log(x);
          buttonEl.classList.replace('btn-primary', 'btn-success');
          this.uploaded = true;
          //console.log(event);
        },
        (err: HttpErrorResponse) => {
          console.log(err);
          buttonEl.classList.replace('btn-primary', 'btn-danger');
          this.uploaded = true;
        }
      );
      //console.log(res);
    });
  }

  public onSave() {
    if (this.fileName === '') {
      const inputNameEl: HTMLInputElement = this.inputName?.nativeElement;
      inputNameEl.classList.add('is-invalid');
      return;
    }
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    const buttonSaveEl: HTMLButtonElement = this.buttonSave?.nativeElement;
    const saverEl: HTMLAnchorElement = this.saver?.nativeElement;
    let file: File;
    canvasEl.toBlob((blob) => {
      if (blob) file = new File([blob], this.fileName);
      else throw 'No image';
      //console.log(file);
      saverEl.href = URL.createObjectURL(file);
      saverEl.download = this.fileName;
      saverEl.click();
      //console.log(res);
    });
  }

  public onChangeLineThickness(lineThicknessInput: any) {
    //console.log(lineThicknessInput.value);
    this.lineWidth = lineThicknessInput.value;
  }

  public onUploadClasses() {
    if (this.uploaded) {
      this.uploaded = false;
      const buttonEl: HTMLButtonElement = this.button?.nativeElement;
      buttonEl.classList.replace('btn-success', 'btn-primary');
      buttonEl.classList.replace('btn-danger', 'btn-primary');
    }
  }

  public onLoad(imageInput: any) {
    this.onUploadClasses();
    const inputNameEl: HTMLInputElement = this.inputName?.nativeElement;
    this.imageLoaded = false;
    this.resizeComponent();
    const bottomEl: HTMLElement = this.bottom?.nativeElement;
    this.file = imageInput.files[0];
    inputNameEl.value = this.file.name;
    this.fileName = this.file.name;
    const reader = new FileReader();
    const im = this.image;
    reader.addEventListener(
      'load',
      () => {
        // convert image file to base64 string
        im.src = reader.result as string;
      },
      false
    );
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    this.cx = canvasEl.getContext('2d');
    if (this.file) {
      //console.log(this.file);
      reader.readAsDataURL(this.file);
    }
    this.image.onload = () => {
      this.clearCanvas();
      console.log('image has loaded!');

      canvasEl.classList.remove('beforeImg');
      this.imageLoaded = true;

      canvasEl.width = this.image.width;
      canvasEl.height = this.image.height;
      this.cx!.drawImage(this.image, 0, 0, canvasEl.width, canvasEl.height);
      //canvasEl.style.marginBottom = bottomEl.offsetHeight.toString() + 'px';
    };
  }

  private resizeComponent(event?: Event) {
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    const bottomEl: HTMLButtonElement = this.bottom?.nativeElement;
    const canvasDivEl: HTMLButtonElement = this.canvasDiv?.nativeElement;
    const outerEl: HTMLElement | null | undefined =
      this.main?.nativeElement.parentElement?.parentElement;
    if (!this.imageLoaded) {
      if (outerEl) {
        canvasEl.height = outerEl.offsetHeight - (bottomEl.offsetHeight + 10);
        canvasEl.width = outerEl.offsetWidth;
      }
      this.cx = canvasEl.getContext('2d');
      this.clearCanvas();
    } else {
      canvasEl.style.marginBottom = bottomEl.offsetHeight.toString() + 'px';
      if (outerEl) {
        canvasEl.style.marginTop =
          (~~(
            (outerEl.offsetHeight - bottomEl.offsetHeight - canvasEl.height) /
            2
          )).toString() + 'px';
      }
    }
  }

  private createUserEvents() {
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;

    canvasEl.addEventListener('mousedown', this.pressEventHandler);
    canvasEl.addEventListener('mousemove', this.dragEventHandler);
    canvasEl.addEventListener('mouseup', this.releaseEventHandler);
    canvasEl.addEventListener('mouseout', this.cancelEventHandler);

    canvasEl.addEventListener('touchstart', this.pressEventHandler);
    canvasEl.addEventListener('touchmove', this.dragEventHandler);
    canvasEl.addEventListener('touchend', this.releaseEventHandler);
    canvasEl.addEventListener('touchcancel', this.cancelEventHandler);
  }

  private redraw() {
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    this.cx = canvasEl.getContext('2d');
    if (!this.cx) throw 'no context';
    this.cx.lineWidth = this.lineWidth;
    this.cx.strokeStyle = this.color;
    let clickX = this.clickX;
    let context = this.cx;
    let clickDrag = this.clickDrag;
    let clickY = this.clickY;
    this.onUploadClasses();
    if (!context) throw 'No context';
    for (let i = 0; i < clickX.length; ++i) {
      context.beginPath();
      if (clickDrag[i] && i) {
        context.moveTo(clickX[i - 1], clickY[i - 1]);
      } else {
        context.moveTo(clickX[i] - 1, clickY[i]);
      }

      context.lineTo(clickX[i], clickY[i]);
      context.stroke();
    }
    context.closePath();
  }

  private addClick(x: number, y: number, dragging: boolean) {
    this.clickX.push(x);
    this.clickY.push(y);
    this.clickDrag.push(dragging);
  }

  private clearCanvas() {
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    this.cx = canvasEl.getContext('2d');
    if (!this.cx) throw 'no context';
    this.cx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    this.clickX = [];
    this.clickY = [];
    this.clickDrag = [];
  }

  private releaseEventHandler = () => {
    this.paint = false;
    this.redraw();
  };

  private cancelEventHandler = () => {
    this.paint = false;
  };
  private pressEventHandler = (e: MouseEvent | TouchEvent) => {
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    let mouseX = (e as TouchEvent).changedTouches
      ? (e as TouchEvent).changedTouches[0].pageX
      : (e as MouseEvent).pageX;
    let mouseY = (e as TouchEvent).changedTouches
      ? (e as TouchEvent).changedTouches[0].pageY
      : (e as MouseEvent).pageY;
    mouseX -= canvasEl.offsetLeft;
    mouseY -= canvasEl.offsetTop;

    this.paint = true;
    this.addClick(mouseX, mouseY, false);
    this.redraw();
  };

  private dragEventHandler = (e: MouseEvent | TouchEvent) => {
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    let mouseX = (e as TouchEvent).changedTouches
      ? (e as TouchEvent).changedTouches[0].pageX
      : (e as MouseEvent).pageX;
    let mouseY = (e as TouchEvent).changedTouches
      ? (e as TouchEvent).changedTouches[0].pageY
      : (e as MouseEvent).pageY;
    mouseX -= canvasEl.offsetLeft;
    mouseY -= canvasEl.offsetTop;

    if (this.paint) {
      this.addClick(mouseX, mouseY, true);
      this.redraw();
    }

    e.preventDefault();
  };
}
