// H5合同管理系统主程序
(function() {
  // 状态管理
  const state = {
    user: null,
    currentContract: null,
    customers: [],
    contracts: [],
    pendingContracts: []
  };

  // DOM元素
  const elements = {
    loginPage: document.getElementById('login-page'),
    mainPage: document.getElementById('main-page'),
    contractDetailPage: document.getElementById('contract-detail-page'),
    loginForm: document.getElementById('login-form'),
    userName: document.getElementById('user-name'),
    userRole: document.getElementById('user-role'),
    logoutBtn: document.getElementById('logout-btn'),
    backBtn: document.getElementById('back-btn'),
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    contractList: document.getElementById('contract-list'),
    pendingList: document.getElementById('pending-list'),
    contractForm: document.getElementById('contract-form'),
    customerSelect: document.getElementById('customer-select'),
    contractDetail: document.getElementById('contract-detail'),
    signatureSection: document.getElementById('signature-section'),
    signaturePadCanvas: document.getElementById('signature-pad'),
    clearSignatureBtn: document.getElementById('clear-signature'),
    pdfPreviewContainer: document.getElementById('pdf-preview-container'),
    pdfPreview: document.getElementById('pdf-preview'),
    signatureDraggable: document.getElementById('signature-draggable'),
    approvalComment: document.getElementById('approval-comment'),
    actionButtons: document.getElementById('action-buttons'),
    compareSection: document.getElementById('compare-section'),
    compareFile: document.getElementById('compare-file'),
    compareBtn: document.getElementById('compare-btn'),
    compareResult: document.getElementById('compare-result'),
    approvalRecordsList: document.getElementById('approval-records-list')
  };

  // 签名板和可拖动签名
  let signaturePad = null;
  let draggableSignature = null;

  // 状态文本映射
  const statusMap = {
    'draft': '草稿',
    'pending_sales_manager': '待销售经理审批',
    'pending_sales_director': '待销售总监审批',
    'pending_legal': '待法务审核',
    'pending_seal': '待落章',
    'approved': '已批准',
    'rejected': '已拒绝',
    'sealed': '已落章'
  };

  // 角色文本映射
  const roleMap = {
    'salesperson': '销售员',
    'sales_manager': '销售经理',
    'sales_director': '销售总监',
    'legal_staff': '法务人员',
    'seal_keeper': '落章人员',
    'admin': '管理员'
  };

  // 审批类型图标映射
  const typeIconMap = {
    'submit': '📤',
    'approve': '✅',
    'reject': '❌',
    'legal_review': '⚖️',
    'seal': '🔏'
  };

  // 初始化
  function init() {
    bindEvents();
    checkAuth();
  }

  // 绑定事件
  function bindEvents() {
    // 登录
    elements.loginForm.addEventListener('submit', handleLogin);
    
    // 退出
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // 返回
    elements.backBtn.addEventListener('click', () => showPage('main'));
    
    // 标签切换
    elements.navTabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // 创建合同
    elements.contractForm.addEventListener('submit', handleCreateContract);
    
    // 清除签名
    elements.clearSignatureBtn.addEventListener('click', () => {
      if (signaturePad) signaturePad.clear();
    });
    
    // 合同比对
    elements.compareBtn.addEventListener('click', handleCompare);
  }

  // 检查登录状态
  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      api.setToken(token);
      try {
        const res = await api.users.getMe();
        state.user = res.data;
        showPage('main');
        updateUserInfo();
        loadData();
      } catch (error) {
        api.clearToken();
        showPage('login');
      }
    } else {
      showPage('login');
    }
  }

  // 处理登录
  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
      const res = await api.users.login(username, password);
      api.setToken(res.data.token);
      state.user = res.data.user;
      showToast('登录成功');
      showPage('main');
      updateUserInfo();
      loadData();
    } catch (error) {
      showToast(error.message || '登录失败');
    }
  }

  // 处理退出
  function handleLogout() {
    api.clearToken();
    state.user = null;
    showPage('login');
    elements.loginForm.reset();
  }

  // 显示页面
  function showPage(page) {
    elements.loginPage.classList.remove('active');
    elements.mainPage.classList.remove('active');
    elements.contractDetailPage.classList.remove('active');
    
    switch (page) {
      case 'login':
        elements.loginPage.classList.add('active');
        break;
      case 'main':
        elements.mainPage.classList.add('active');
        break;
      case 'detail':
        elements.contractDetailPage.classList.add('active');
        initSignaturePad();
        initDraggableSignature();
        break;
    }
  }

  // 更新用户信息
  function updateUserInfo() {
    if (state.user) {
      elements.userName.textContent = state.user.name;
      elements.userRole.textContent = `(${roleMap[state.user.role] || state.user.role})`;
    }
  }

  // 加载数据
  async function loadData() {
    await Promise.all([
      loadCustomers(),
      loadContracts(),
      loadPendingContracts()
    ]);
  }

  // 加载客户列表
  async function loadCustomers() {
    try {
      const res = await api.customers.getAll();
      state.customers = res.data;
      renderCustomerOptions();
    } catch (error) {
      console.error('加载客户失败:', error);
    }
  }

  // 渲染客户选项
  function renderCustomerOptions() {
    elements.customerSelect.innerHTML = '<option value="">请选择客户</option>';
    state.customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.id;
      option.textContent = customer.name;
      option.dataset.customerName = customer.name;
      elements.customerSelect.appendChild(option);
    });
  }

  // 加载合同列表
  async function loadContracts() {
    try {
      const res = await api.contracts.getAll({ createdBy: state.user.id });
      state.contracts = res.data;
      renderContractList();
    } catch (error) {
      console.error('加载合同失败:', error);
    }
  }

  // 加载待审批列表
  async function loadPendingContracts() {
    try {
      const res = await api.contracts.getPending(state.user.role);
      state.pendingContracts = res.data;
      renderPendingList();
    } catch (error) {
      console.error('加载待审批合同失败:', error);
    }
  }

  // 渲染合同列表
  function renderContractList() {
    if (state.contracts.length === 0) {
      elements.contractList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <p>暂无合同</p>
        </div>
      `;
      return;
    }
    
    elements.contractList.innerHTML = state.contracts.map(contract => `
      <div class="contract-item" data-id="${contract.id}">
        <div class="contract-item-header">
          <span class="contract-title">${contract.title}</span>
          <span class="contract-status status-${contract.status}">${statusMap[contract.status] || contract.status}</span>
        </div>
        <div class="contract-info">
          <p>合同编号: ${contract.contract_number}</p>
          <p>客户: ${contract.customer_name || '-'}</p>
          <p>金额: ¥${contract.amount ? contract.amount.toLocaleString() : '0'}</p>
          <p>创建时间: ${formatDate(contract.created_at)}</p>
        </div>
      </div>
    `).join('');
    
    // 绑定点击事件
    elements.contractList.querySelectorAll('.contract-item').forEach(item => {
      item.addEventListener('click', () => openContractDetail(item.dataset.id));
    });
  }

  // 渲染待审批列表
  function renderPendingList() {
    if (state.pendingContracts.length === 0) {
      elements.pendingList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <p>暂无待审批合同</p>
        </div>
      `;
      return;
    }
    
    elements.pendingList.innerHTML = state.pendingContracts.map(contract => `
      <div class="contract-item" data-id="${contract.id}">
        <div class="contract-item-header">
          <span class="contract-title">${contract.title}</span>
          <span class="contract-status status-${contract.status}">${statusMap[contract.status] || contract.status}</span>
        </div>
        <div class="contract-info">
          <p>合同编号: ${contract.contract_number}</p>
          <p>客户: ${contract.customer_name || '-'}</p>
          <p>提交人: ${contract.created_by_name || '-'}</p>
          <p>创建时间: ${formatDate(contract.created_at)}</p>
        </div>
      </div>
    `).join('');
    
    // 绑定点击事件
    elements.pendingList.querySelectorAll('.contract-item').forEach(item => {
      item.addEventListener('click', () => openContractDetail(item.dataset.id));
    });
  }

  // 切换标签
  function switchTab(tabId) {
    elements.navTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    elements.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
    
    // 刷新数据
    if (tabId === 'my-contracts') {
      loadContracts();
    } else if (tabId === 'pending-approval') {
      loadPendingContracts();
    }
  }

  // 创建合同
  async function handleCreateContract(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const selectedOption = elements.customerSelect.options[elements.customerSelect.selectedIndex];
    
    const data = {
      title: formData.get('title'),
      type: formData.get('type'),
      customerId: formData.get('customerId'),
      customerName: selectedOption.dataset.customerName,
      amount: parseFloat(formData.get('amount')) || 0,
      content: formData.get('content'),
      createdBy: state.user.id,
      createdByName: state.user.name
    };
    
    try {
      const res = await api.contracts.create(data);
      const contract = res.data;
      
      // 如果有文件，上传文件
      const fileInput = document.getElementById('contract-file');
      if (fileInput.files.length > 0) {
        await api.contracts.uploadFile(contract.id, fileInput.files[0]);
      }
      
      showToast('合同创建成功');
      e.target.reset();
      switchTab('my-contracts');
      loadContracts();
    } catch (error) {
      showToast(error.message || '创建失败');
    }
  }

  // 打开合同详情
  async function openContractDetail(contractId) {
    try {
      const res = await api.contracts.getById(contractId);
      state.currentContract = res.data;
      renderContractDetail();
      showPage('detail');
    } catch (error) {
      showToast('加载合同详情失败');
    }
  }

  // 渲染合同详情
  function renderContractDetail() {
    const contract = state.currentContract;
    
    elements.contractDetail.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">合同编号</span>
        <span class="detail-value">${contract.contract_number}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">合同标题</span>
        <span class="detail-value">${contract.title}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">合同类型</span>
        <span class="detail-value">${contract.type === 'own_template' ? '我方模板' : '客户模板'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">客户名称</span>
        <span class="detail-value">${contract.customer_name || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">合同金额</span>
        <span class="detail-value">¥${contract.amount ? contract.amount.toLocaleString() : '0'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">合同状态</span>
        <span class="detail-value"><span class="contract-status status-${contract.status}">${statusMap[contract.status]}</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">创建人</span>
        <span class="detail-value">${contract.created_by_name || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">创建时间</span>
        <span class="detail-value">${formatDate(contract.created_at)}</span>
      </div>
      ${contract.content ? `
      <div class="detail-row">
        <span class="detail-label">备注</span>
        <span class="detail-value">${contract.content}</span>
      </div>
      ` : ''}
      ${contract.final_file_url ? `
      <div class="detail-row">
        <span class="detail-label">最终文件</span>
        <span class="detail-value"><a href="${contract.final_file_url}" target="_blank">下载</a></span>
      </div>
      ` : ''}
    `;
    
    // 渲染操作按钮
    renderActionButtons();
    
    // 渲染审批记录
    renderApprovalRecords();
    
    // 显示/隐藏比对区域
    elements.compareSection.style.display = contract.status === 'sealed' ? 'block' : 'none';
  }

  // 渲染操作按钮
  function renderActionButtons() {
    const contract = state.currentContract;
    const user = state.user;
    let buttons = '';
    
    // 草稿状态 - 创建人可以提交
    if (contract.status === 'draft' && contract.created_by === user.id) {
      elements.signatureSection.style.display = 'block';
      elements.pdfPreviewContainer.style.display = 'block';
      buttons = `
        <button class="btn btn-primary" onclick="app.submitContract()">提交审批</button>
      `;
    }
    // 待销售经理审批
    else if (contract.status === 'pending_sales_manager' && user.role === 'sales_manager') {
      elements.signatureSection.style.display = 'block';
      elements.pdfPreviewContainer.style.display = 'block';
      buttons = `
        <button class="btn btn-success" onclick="app.approveContract()">批准</button>
        <button class="btn btn-danger" onclick="app.rejectContract()">拒绝</button>
      `;
    }
    // 待销售总监审批
    else if (contract.status === 'pending_sales_director' && user.role === 'sales_director') {
      elements.signatureSection.style.display = 'block';
      elements.pdfPreviewContainer.style.display = 'block';
      buttons = `
        <button class="btn btn-success" onclick="app.approveContract()">批准</button>
        <button class="btn btn-danger" onclick="app.rejectContract()">拒绝</button>
      `;
    }
    // 待法务审核
    else if (contract.status === 'pending_legal' && user.role === 'legal_staff') {
      elements.signatureSection.style.display = 'block';
      elements.pdfPreviewContainer.style.display = 'block';
      buttons = `
        <button class="btn btn-success" onclick="app.approveContract()">法务通过</button>
        <button class="btn btn-danger" onclick="app.rejectContract()">法务拒绝</button>
      `;
    }
    // 待落章
    else if (contract.status === 'pending_seal' && user.role === 'seal_keeper') {
      elements.signatureSection.style.display = 'block';
      elements.pdfPreviewContainer.style.display = 'block';
      buttons = `
        <button class="btn btn-success" onclick="app.sealContract()">落章确认</button>
        <button class="btn btn-danger" onclick="app.rejectContract()">拒绝</button>
      `;
    }
    // 已落章 - 可以生成最终文件
    else if (contract.status === 'sealed') {
      elements.signatureSection.style.display = 'none';
      if (!contract.final_file_url) {
        buttons = `
          <button class="btn btn-primary" onclick="app.generateFinalFile()">生成最终文件</button>
        `;
      }
    }
    else {
      elements.signatureSection.style.display = 'none';
    }
    
    elements.actionButtons.innerHTML = buttons;
  }

  // 渲染审批记录
  function renderApprovalRecords() {
    const records = state.currentContract.approvalRecords || [];
    
    if (records.length === 0) {
      elements.approvalRecordsList.innerHTML = '<p class="empty-state">暂无审批记录</p>';
      return;
    }
    
    elements.approvalRecordsList.innerHTML = records.map(record => `
      <div class="approval-record-item">
        <div class="record-icon ${record.type}">${typeIconMap[record.type] || '📋'}</div>
        <div class="record-content">
          <div class="record-header">
            <span class="record-user">${record.user_name || '-'}</span>
            <span class="record-time">${formatDate(record.timestamp)}</span>
          </div>
          <div class="record-role">${roleMap[record.user_role] || record.user_role}</div>
          <div class="record-comment">${record.comment || '-'}</div>
        </div>
      </div>
    `).join('');
  }

  // 初始化签名板
  function initSignaturePad() {
    if (!signaturePad) {
      signaturePad = new SignaturePad(elements.signaturePadCanvas);
    }
    signaturePad.clear();
  }

  // 初始化可拖动签名
  function initDraggableSignature() {
    if (!draggableSignature) {
      draggableSignature = new DraggableSignature(elements.signatureDraggable, elements.pdfPreview);
    }
  }

  // 提交合同
  async function submitContract() {
    if (signaturePad.isEmpty()) {
      showToast('请先签名');
      return;
    }
    
    const signatureImageUrl = signaturePad.toDataURL();
    const signaturePosition = draggableSignature.getPosition();
    
    try {
      await api.contracts.submit(state.currentContract.id, {
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        signatureImageUrl,
        signaturePosition
      });
      
      showToast('提交成功');
      showPage('main');
      loadContracts();
    } catch (error) {
      showToast(error.message || '提交失败');
    }
  }

  // 审批合同
  async function approveContract() {
    if (signaturePad.isEmpty()) {
      showToast('请先签名');
      return;
    }
    
    const signatureImageUrl = signaturePad.toDataURL();
    const signaturePosition = draggableSignature.getPosition();
    const comment = elements.approvalComment.value;
    
    try {
      await api.contracts.approve(state.currentContract.id, {
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        comment,
        signatureImageUrl,
        signaturePosition
      });
      
      showToast('审批通过');
      showPage('main');
      loadPendingContracts();
    } catch (error) {
      showToast(error.message || '审批失败');
    }
  }

  // 拒绝合同
  async function rejectContract() {
    const comment = elements.approvalComment.value;
    if (!comment) {
      showToast('请填写拒绝原因');
      return;
    }
    
    try {
      await api.contracts.reject(state.currentContract.id, {
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        comment
      });
      
      showToast('已拒绝');
      showPage('main');
      loadPendingContracts();
    } catch (error) {
      showToast(error.message || '操作失败');
    }
  }

  // 落章确认
  async function sealContract() {
    if (signaturePad.isEmpty()) {
      showToast('请先签名确认');
      return;
    }
    
    const signatureImageUrl = signaturePad.toDataURL();
    const signaturePosition = draggableSignature.getPosition();
    const comment = elements.approvalComment.value || '落章确认';
    
    try {
      await api.contracts.approve(state.currentContract.id, {
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        comment,
        signatureImageUrl,
        signaturePosition
      });
      
      showToast('落章成功');
      showPage('main');
      loadPendingContracts();
    } catch (error) {
      showToast(error.message || '落章失败');
    }
  }

  // 生成最终文件
  async function generateFinalFile() {
    try {
      const res = await api.contracts.generateFinal(state.currentContract.id);
      showToast('最终文件生成成功');
      openContractDetail(state.currentContract.id);
    } catch (error) {
      showToast(error.message || '生成失败');
    }
  }

  // 处理合同比对
  async function handleCompare() {
    const file = elements.compareFile.files[0];
    if (!file) {
      showToast('请选择要比对的文件');
      return;
    }
    
    try {
      const res = await api.contracts.compare(state.currentContract.id, file);
      const result = res.data;
      
      let resultClass = result.match ? 'success' : 'warning';
      if (!result.match && result.similarity < 80) {
        resultClass = 'error';
      }
      
      elements.compareResult.className = `compare-result ${resultClass}`;
      elements.compareResult.innerHTML = `
        <p><strong>比对结果:</strong> ${result.message}</p>
        <p><strong>相似度:</strong> ${result.similarity}%</p>
        <p><strong>哈希匹配:</strong> ${result.hashMatch ? '是' : '否'}</p>
      `;
    } catch (error) {
      elements.compareResult.className = 'compare-result error';
      elements.compareResult.innerHTML = `<p>比对失败: ${error.message}</p>`;
    }
  }

  // 格式化日期
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  }

  // 显示提示
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  // 暴露公共方法
  window.app = {
    submitContract,
    approveContract,
    rejectContract,
    sealContract,
    generateFinalFile
  };

  // 启动应用
  init();
})();
