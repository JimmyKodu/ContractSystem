// 签名画板功能
class SignaturePad {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    
    this.init();
  }
  
  init() {
    // 设置画笔样式
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // 绑定事件
    this.bindEvents();
  }
  
  bindEvents() {
    // 鼠标事件
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    
    // 触摸事件
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
  }
  
  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
  
  getTouchPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }
  
  startDrawing(e) {
    this.isDrawing = true;
    const pos = this.getPos(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
  }
  
  handleTouchStart(e) {
    e.preventDefault();
    this.isDrawing = true;
    const pos = this.getTouchPos(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
  }
  
  draw(e) {
    if (!this.isDrawing) return;
    const pos = this.getPos(e);
    this.drawLine(pos.x, pos.y);
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    if (!this.isDrawing) return;
    const pos = this.getTouchPos(e);
    this.drawLine(pos.x, pos.y);
  }
  
  drawLine(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  }
  
  stopDrawing() {
    this.isDrawing = false;
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  isEmpty() {
    const blank = document.createElement('canvas');
    blank.width = this.canvas.width;
    blank.height = this.canvas.height;
    return this.canvas.toDataURL() === blank.toDataURL();
  }
  
  toDataURL() {
    return this.canvas.toDataURL('image/png');
  }
}

// 可拖动签名位置
class DraggableSignature {
  constructor(element, container) {
    this.element = element;
    this.container = container;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 50;
    this.currentY = 50;
    
    this.init();
  }
  
  init() {
    this.element.style.left = this.currentX + 'px';
    this.element.style.top = this.currentY + 'px';
    
    this.bindEvents();
  }
  
  bindEvents() {
    // 鼠标事件
    this.element.addEventListener('mousedown', this.startDrag.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
    
    // 触摸事件
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.stopDrag.bind(this));
  }
  
  startDrag(e) {
    this.isDragging = true;
    this.startX = e.clientX - this.currentX;
    this.startY = e.clientY - this.currentY;
    this.element.style.cursor = 'grabbing';
  }
  
  handleTouchStart(e) {
    e.preventDefault();
    this.isDragging = true;
    const touch = e.touches[0];
    this.startX = touch.clientX - this.currentX;
    this.startY = touch.clientY - this.currentY;
  }
  
  drag(e) {
    if (!this.isDragging) return;
    
    const containerRect = this.container.getBoundingClientRect();
    const elementRect = this.element.getBoundingClientRect();
    
    let newX = e.clientX - this.startX;
    let newY = e.clientY - this.startY;
    
    // 限制在容器内
    newX = Math.max(0, Math.min(newX, containerRect.width - elementRect.width));
    newY = Math.max(0, Math.min(newY, containerRect.height - elementRect.height));
    
    this.currentX = newX;
    this.currentY = newY;
    
    this.element.style.left = this.currentX + 'px';
    this.element.style.top = this.currentY + 'px';
  }
  
  handleTouchMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const containerRect = this.container.getBoundingClientRect();
    const elementRect = this.element.getBoundingClientRect();
    
    let newX = touch.clientX - this.startX;
    let newY = touch.clientY - this.startY;
    
    // 限制在容器内
    newX = Math.max(0, Math.min(newX, containerRect.width - elementRect.width));
    newY = Math.max(0, Math.min(newY, containerRect.height - elementRect.height));
    
    this.currentX = newX;
    this.currentY = newY;
    
    this.element.style.left = this.currentX + 'px';
    this.element.style.top = this.currentY + 'px';
  }
  
  stopDrag() {
    this.isDragging = false;
    this.element.style.cursor = 'move';
  }
  
  getPosition() {
    return {
      x: this.currentX,
      y: this.currentY,
      width: this.element.offsetWidth,
      height: this.element.offsetHeight,
      pageNumber: 1
    };
  }
}

// 暴露到全局
window.SignaturePad = SignaturePad;
window.DraggableSignature = DraggableSignature;
