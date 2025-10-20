/**
 * 🏦 BANCO TIKAL - Payment Widget
 * Widget de pagos con 2 opciones:
 * 1. Pago con Tarjeta (instantáneo)
 * 2. Generar Orden de Pago (pagar después en portal)
 */

(function() {
    'use strict';

    const BancoTikalWidget = {
        version: '2.0.0',
        name: 'Banco Tikal Payment Widget',
        // ✅ SIEMPRE usar la URL de producción (sin detección automática)
        apiUrl: 'https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1',
        
        config: {
            merchantId: null,
            amount: 0,
            currency: 'GTQ',
            onSuccess: null,
            onError: null,
            paymentMethod: 'card' // 'card' o 'orden'
        },

        init: function(options) {
            console.log('🏦 Inicializando Banco Tikal Widget v' + this.version);
            console.log('🌐 API URL:', this.apiUrl);
            
            // Validar configuración
            if (!options.merchantId) {
                console.error('❌ merchantId es requerido');
                return;
            }
            
            if (!options.amount || options.amount <= 0) {
                console.error('❌ amount debe ser mayor a 0');
                return;
            }

            // Configurar widget
            this.config = {
                merchantId: options.merchantId,
                amount: parseFloat(options.amount),
                currency: options.currency || 'GTQ',
                onSuccess: options.onSuccess || function() {},
                onError: options.onError || function() {}
            };

            // Renderizar widget
            this.render();
        },

        render: function() {
            const container = document.getElementById('banco-tikal-widget');
            if (!container) {
                console.error('❌ Contenedor #banco-tikal-widget no encontrado');
                return;
            }

            container.innerHTML = `
                <div class="banco-tikal-widget">
                    <div class="widget-header">
                        <h2>🏦 Banco Tikal</h2>
                        <p>Pago seguro de Q${this.config.amount.toFixed(2)}</p>
                    </div>

                    <!-- Opciones de pago -->
                    <div class="payment-options">
                        <div class="payment-option active" data-method="card" onclick="BancoTikalWidget.selectMethod('card')">
                            <div class="option-icon">💳</div>
                            <h3>Pagar con Tarjeta</h3>
                            <p>Pago instantáneo</p>
                        </div>
                        <div class="payment-option" data-method="orden" onclick="BancoTikalWidget.selectMethod('orden')">
                            <div class="option-icon">🧾</div>
                            <h3>Generar Orden</h3>
                            <p>Pagar después</p>
                        </div>
                    </div>

                    <!-- Formulario de pago con tarjeta -->
                    <div id="card-form" class="payment-form active">
                        <h3>Datos de la Tarjeta</h3>
                        <div class="form-group">
                            <label>Número de Tarjeta</label>
                            <input type="text" id="card-number" placeholder="4000 0077 1414 4690" maxlength="19">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Vencimiento (MM/YY)</label>
                                <input type="text" id="exp-date" placeholder="12/26" maxlength="5">
                            </div>
                            <div class="form-group">
                                <label>CVV</label>
                                <input type="text" id="cvv" placeholder="123" maxlength="4">
                            </div>
                        </div>
                        <button class="btn-primary" onclick="BancoTikalWidget.processCardPayment()">
                            💳 Pagar Ahora
                        </button>
                    </div>

                    <!-- Formulario para generar orden -->
                    <div id="orden-form" class="payment-form">
                        <h3>Generar Orden de Pago</h3>
                        <p class="info-text">Se generará un código y clave para que puedas pagar después en tu portal de cliente</p>
                        <div class="form-group">
                            <label>Concepto del Pago</label>
                            <input type="text" id="concepto" placeholder="Descripción del pago" value="Pago de servicio">
                        </div>
                        <div class="form-group">
                            <label>Vigencia (horas)</label>
                            <select id="vigencia">
                                <option value="24">24 horas</option>
                                <option value="48" selected>48 horas (2 días)</option>
                                <option value="72">72 horas (3 días)</option>
                                <option value="168">7 días</option>
                            </select>
                        </div>
                        <button class="btn-secondary" onclick="BancoTikalWidget.generateOrden()">
                            🧾 Generar Orden
                        </button>
                    </div>

                    <!-- Resultado de orden generada -->
                    <div id="orden-result" class="orden-result" style="display: none;">
                        <div class="success-icon">✅</div>
                        <h3>Orden Generada Exitosamente</h3>
                        <div class="orden-details">
                            <div class="orden-item">
                                <label>Código de Orden:</label>
                                <div class="orden-code" id="orden-codigo">ORD1234567</div>
                            </div>
                            <div class="orden-item">
                                <label>Clave de Acceso:</label>
                                <div class="orden-code" id="orden-clave">8852</div>
                            </div>
                            <div class="orden-item">
                                <label>Monto:</label>
                                <div class="orden-value">Q<span id="orden-monto">${this.config.amount.toFixed(2)}</span></div>
                            </div>
                            <div class="orden-item">
                                <label>Válido hasta:</label>
                                <div class="orden-value" id="orden-vencimiento">--</div>
                            </div>
                        </div>
                        <div class="orden-instructions">
                            <h4>📝 Instrucciones:</h4>
                            <ol>
                                <li>Guarda el <strong>Código</strong> y <strong>Clave</strong></li>
                                <li>Ingresa a tu portal de Banco Tikal</li>
                                <li>Selecciona "Pagar Orden"</li>
                                <li>Ingresa el código y clave para completar el pago</li>
                            </ol>
                        </div>
                        <div class="orden-actions">
                            <button class="btn-outline" onclick="BancoTikalWidget.printOrden()">🖨️ Imprimir</button>
                            <button class="btn-outline" onclick="BancoTikalWidget.copyOrden()">📋 Copiar</button>
                        </div>
                    </div>

                    <!-- Área de mensajes -->
                    <div id="widget-message" class="widget-message"></div>

                    <!-- Footer -->
                    <div class="widget-footer">
                        <small>🔒 Pago seguro con Banco Tikal</small>
                    </div>
                </div>
            `;

            // Aplicar estilos
            this.injectStyles();

            // Configurar formato de inputs
            this.setupInputFormatting();
        },

        selectMethod: function(method) {
            this.config.paymentMethod = method;
            
            // Actualizar opciones activas
            document.querySelectorAll('.payment-option').forEach(opt => {
                opt.classList.remove('active');
            });
            document.querySelector(`[data-method="${method}"]`).classList.add('active');

            // Mostrar/ocultar formularios
            document.getElementById('card-form').classList.remove('active');
            document.getElementById('orden-form').classList.remove('active');
            document.getElementById('orden-result').style.display = 'none';
            
            if (method === 'card') {
                document.getElementById('card-form').classList.add('active');
            } else {
                document.getElementById('orden-form').classList.add('active');
            }

            // Limpiar mensajes
            document.getElementById('widget-message').innerHTML = '';
        },

        processCardPayment: async function() {
            const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
            const expDate = document.getElementById('exp-date').value;
            const cvv = document.getElementById('cvv').value;

            // Validaciones
            if (!cardNumber || !expDate || !cvv) {
                this.showMessage('Por favor complete todos los campos', 'error');
                return;
            }

            this.showMessage('⏳ Procesando pago...', 'info');

            try {
                const response = await fetch(`${this.apiUrl}/pagos/charge`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        merchantId: this.config.merchantId,
                        cardNumber: cardNumber,
                        amount: this.config.amount,
                        expDate: expDate,
                        cvv: cvv,
                        currency: this.config.currency
                    })
                });

                const data = await response.json();

                if (data.status === 'success') {
                    this.showMessage('✅ Pago procesado exitosamente', 'success');
                    this.config.onSuccess(data.data);
                } else {
                    this.showMessage(`❌ ${data.message}`, 'error');
                    this.config.onError(data);
                }
            } catch (error) {
                this.showMessage('❌ Error de conexión', 'error');
                this.config.onError({ message: error.message });
            }
        },

        generateOrden: async function() {
            const concepto = document.getElementById('concepto').value;
            const vigencia = document.getElementById('vigencia').value;

            if (!concepto) {
                this.showMessage('Por favor ingrese un concepto', 'error');
                return;
            }

            this.showMessage('⏳ Generando orden de pago...', 'info');

            try {
                // ✅ Agregar timeout de 30 segundos
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const response = await fetch(`${this.apiUrl}/negocio/${this.config.merchantId}/generar-orden`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        monto: this.config.amount,
                        concepto: concepto,
                        vigenciaHoras: parseInt(vigencia)
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Error ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.showOrdenResult(data.data);
                    this.config.onSuccess(data.data);
                } else {
                    throw new Error(data.message || 'Error desconocido');
                }
            } catch (error) {
                console.error('Error generando orden:', error);
                
                if (error.name === 'AbortError') {
                    this.showMessage('❌ Tiempo de espera agotado. Intente nuevamente.', 'error');
                } else {
                    this.showMessage(`❌ ${error.message}`, 'error');
                }
                
                this.config.onError({ message: error.message });
            }
        },

        showOrdenResult: function(ordenData) {
            // Ocultar formulario
            document.getElementById('orden-form').style.display = 'none';
            
            // Mostrar resultado
            const resultDiv = document.getElementById('orden-result');
            document.getElementById('orden-codigo').textContent = ordenData.codigoOrden;
            document.getElementById('orden-clave').textContent = ordenData.claveAcceso;
            document.getElementById('orden-monto').textContent = this.config.amount.toFixed(2);
            document.getElementById('orden-vencimiento').textContent = 
                new Date(ordenData.fechaVencimiento).toLocaleString('es-GT');
            
            resultDiv.style.display = 'block';
            
            // Guardar datos para copiar/imprimir
            this.currentOrden = ordenData;
        },

        printOrden: function() {
            window.print();
        },

        copyOrden: function() {
            const codigo = document.getElementById('orden-codigo').textContent;
            const clave = document.getElementById('orden-clave').textContent;
            const text = `Banco Tikal - Orden de Pago\nCódigo: ${codigo}\nClave: ${clave}\nMonto: Q${this.config.amount.toFixed(2)}`;
            
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage('✅ Datos copiados al portapapeles', 'success');
            }).catch(() => {
                this.showMessage('❌ Error al copiar', 'error');
            });
        },

        showMessage: function(message, type) {
            const messageDiv = document.getElementById('widget-message');
            messageDiv.className = `widget-message ${type}`;
            messageDiv.textContent = message;
            messageDiv.style.display = 'block';

            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
            }
        },

        setupInputFormatting: function() {
            // Formatear número de tarjeta
            const cardInput = document.getElementById('card-number');
            if (cardInput) {
                cardInput.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\s/g, '');
                    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                    e.target.value = formatted;
                });
            }

            // Formatear fecha de vencimiento
            const expInput = document.getElementById('exp-date');
            if (expInput) {
                expInput.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    e.target.value = value;
                });
            }
        },

        injectStyles: function() {
            if (document.getElementById('banco-tikal-styles')) return;

            const styles = document.createElement('style');
            styles.id = 'banco-tikal-styles';
            styles.textContent = `
                .banco-tikal-widget {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 500px;
                    margin: 0 auto;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    padding: 30px;
                }

                .widget-header {
                    text-align: center;
                    margin-bottom: 25px;
                }

                .widget-header h2 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                }

                .payment-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 25px;
                }

                .payment-option {
                    padding: 20px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-align: center;
                }

                .payment-option:hover {
                    border-color: #3498db;
                    transform: translateY(-2px);
                }

                .payment-option.active {
                    border-color: #3498db;
                    background: #e3f2fd;
                }

                .option-icon {
                    font-size: 32px;
                    margin-bottom: 10px;
                }

                .payment-option h3 {
                    font-size: 16px;
                    margin-bottom: 5px;
                    color: #2c3e50;
                }

                .payment-option p {
                    font-size: 12px;
                    color: #7f8c8d;
                    margin: 0;
                }

                .payment-form {
                    display: none;
                }

                .payment-form.active {
                    display: block;
                }

                .payment-form h3 {
                    margin-bottom: 15px;
                    color: #2c3e50;
                }

                .info-text {
                    background: #fff3cd;
                    padding: 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    margin-bottom: 15px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    color: #555;
                    font-weight: 600;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s;
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #3498db;
                }

                .btn-primary,
                .btn-secondary,
                .btn-outline {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    color: white;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
                }

                .btn-secondary {
                    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
                    color: white;
                }

                .btn-secondary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4);
                }

                .btn-outline {
                    background: white;
                    border: 2px solid #3498db;
                    color: #3498db;
                    margin-top: 10px;
                }

                .btn-outline:hover {
                    background: #3498db;
                    color: white;
                }

                .orden-result {
                    text-align: center;
                }

                .success-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }

                .orden-details {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }

                .orden-item {
                    margin-bottom: 15px;
                }

                .orden-item label {
                    display: block;
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 5px;
                }

                .orden-code {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2c3e50;
                    background: #fff;
                    padding: 10px;
                    border-radius: 6px;
                    border: 2px dashed #3498db;
                }

                .orden-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: #27ae60;
                }

                .orden-instructions {
                    text-align: left;
                    background: #e3f2fd;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }

                .orden-instructions h4 {
                    margin-bottom: 10px;
                    color: #2c3e50;
                }

                .orden-instructions ol {
                    margin-left: 20px;
                }

                .orden-instructions li {
                    margin-bottom: 8px;
                    color: #555;
                }

                .orden-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .widget-message {
                    padding: 12px;
                    border-radius: 6px;
                    margin-top: 15px;
                    display: none;
                    text-align: center;
                }

                .widget-message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .widget-message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .widget-message.info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }

                .widget-footer {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    color: #7f8c8d;
                }
            `;
            document.head.appendChild(styles);
        }
    };

    // Exponer globalmente
    window.BancoTikalWidget = BancoTikalWidget;

    console.log('🏦 Banco Tikal Widget cargado exitosamente v' + BancoTikalWidget.version);
    console.log('🌐 Usando API:', BancoTikalWidget.apiUrl);

})();
