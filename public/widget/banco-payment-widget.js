/**
 * Banco GT - Widget de Pago y Gestión
 * Versión: 1.1.0
 * Integración fácil para comercios electrónicos
 */

class BancoPaymentWidget {
    constructor(config) {
        this.version = '1.1.0';
        this.config = {
            merchantId: config.merchantId,
            apiUrl: config.apiUrl || 'https://banco-gt-api-aa7d620b23f8.herokuapp.com',
            theme: config.theme || 'default',
            onSuccess: config.onSuccess || function() {},
            onError: config.onError || function() {},
            onCancel: config.onCancel || function() {},
            container: config.container || 'banco-payment-widget',
            language: config.language || 'es',
            mode: config.mode || 'payment', // 'payment' o 'business'
            autoUpdate: config.autoUpdate !== false, // Por defecto true
            showVersionInfo: config.showVersionInfo || false
        };
        
        this.isOpen = false;
        this.init();
        
        // Verificar actualizaciones si está habilitado
        if (this.config.autoUpdate) {
            this.checkForUpdates();
        }
    }

    // Verificar si hay nuevas versiones disponibles
    async checkForUpdates() {
        try {
            const response = await fetch(`${this.config.apiUrl}/api/v1/widget/version`);
            const versionInfo = await response.json();
            
            if (versionInfo.version !== this.version) {
                this.notifyUpdate(versionInfo);
            }
        } catch (error) {
            // Silenciosamente ignorar errores de verificación
        }
    }

    // Notificar sobre actualizaciones disponibles
    notifyUpdate(versionInfo) {
        if (this.config.showVersionInfo) {
            console.log(`🆕 Nueva versión del Banco GT Widget disponible: ${versionInfo.version}`);
            console.log('Nuevas características:', versionInfo.features);
            console.log('Para actualizar, visite:', versionInfo.updateUrl);
        }
    }

    // Mostrar información de la versión actual
    getVersionInfo() {
        return {
            version: this.version,
            features: [
                'Pagos con tarjeta',
                'Panel de negocio',
                'Generación de órdenes',
                'Dashboard en tiempo real',
                'Códigos QR'
            ]
        };
    }

    init() {
        this.createStyles();
        this.createWidget();
        this.attachEvents();
    }

    createStyles() {
        const styles = `
            <style id="banco-payment-styles">
                .banco-payment-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 10000;
                    display: none;
                    justify-content: center;
                    align-items: center;
                }

                .banco-payment-modal {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    width: 90%;
                    max-width: 450px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .banco-payment-header {
                    background: linear-gradient(135deg, #1e40af, #3b82f6);
                    color: white;
                    padding: 20px;
                    border-radius: 12px 12px 0 0;
                    position: relative;
                }

                .banco-payment-close {
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    transition: background 0.2s;
                }

                .banco-payment-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .banco-payment-title {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                }

                .banco-payment-subtitle {
                    margin: 5px 0 0 0;
                    font-size: 14px;
                    opacity: 0.9;
                }

                .banco-payment-body {
                    padding: 30px;
                }

                .banco-payment-amount {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #3b82f6;
                }

                .banco-payment-amount-label {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 5px;
                }

                .banco-payment-amount-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1e293b;
                }

                .banco-form-group {
                    margin-bottom: 20px;
                }

                .banco-form-label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                }

                .banco-form-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                }

                .banco-form-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .banco-form-row {
                    display: flex;
                    gap: 15px;
                }

                .banco-form-col {
                    flex: 1;
                }

                .banco-payment-button {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #059669, #10b981);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    margin-top: 10px;
                }

                .banco-payment-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);
                }

                .banco-payment-button:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .banco-loading {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 10px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .banco-security-info {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 20px;
                    padding: 15px;
                    background: #f0fdf4;
                    border-radius: 8px;
                    font-size: 12px;
                    color: #166534;
                }

                .banco-security-icon {
                    margin-right: 8px;
                    font-size: 16px;
                }

                .banco-error {
                    background: #fef2f2;
                    color: #dc2626;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-left: 4px solid #dc2626;
                }

                /* 🎉 NUEVOS ESTILOS PARA RESPUESTA EXITOSA */
                .banco-success-screen {
                    display: none;
                    text-align: center;
                    padding: 40px 30px;
                }

                .banco-success-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #059669, #10b981);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    animation: successPulse 0.6s ease-out;
                }

                @keyframes successPulse {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .banco-success-checkmark {
                    color: white;
                    font-size: 40px;
                    font-weight: bold;
                }

                .banco-success-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #065f46;
                    margin: 0 0 10px 0;
                }

                .banco-success-message {
                    font-size: 16px;
                    color: #6b7280;
                    margin: 0 0 30px 0;
                    line-height: 1.5;
                }

                .banco-transaction-details {
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    border-left: 4px solid #10b981;
                }

                .banco-detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 14px;
                }

                .banco-detail-row:last-child {
                    margin-bottom: 0;
                }

                .banco-detail-label {
                    color: #6b7280;
                    font-weight: 500;
                }

                .banco-detail-value {
                    color: #1f2937;
                    font-weight: 600;
                }

                .banco-success-actions {
                    display: flex;
                    gap: 15px;
                    margin-top: 30px;
                }

                .banco-btn-secondary {
                    flex: 1;
                    padding: 12px 20px;
                    background: #f3f4f6;
                    color: #374151;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .banco-btn-secondary:hover {
                    background: #e5e7eb;
                }

                .banco-btn-primary {
                    flex: 1;
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #1e40af, #3b82f6);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .banco-btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(30, 64, 175, 0.3);
                }

                .banco-success-footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #6b7280;
                    text-align: center;
                }

                .banco-success-animation {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    overflow: hidden;
                    border-radius: 12px;
                }

                .banco-confetti {
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: #10b981;
                    animation: confetti-fall 3s linear infinite;
                }

                @keyframes confetti-fall {
                    0% {
                        transform: translateY(-100vh) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }

                /* Diferentes colores para confetti */
                .banco-confetti:nth-child(2n) { background: #3b82f6; }
                .banco-confetti:nth-child(3n) { background: #f59e0b; }
                .banco-confetti:nth-child(4n) { background: #ef4444; }
                .banco-confetti:nth-child(5n) { background: #8b5cf6; }

                /* Estilos para modo negocio */
                .banco-business-modal {
                    width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .banco-business-menu {
                    display: flex;
                    border-bottom: 2px solid #e1e5e9;
                    margin-bottom: 20px;
                }
                
                .banco-menu-btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    font-size: 14px;
                    color: #6c757d;
                    transition: all 0.3s ease;
                }
                
                .banco-menu-btn.active {
                    background: linear-gradient(45deg, #007bff, #0056b3);
                    color: white;
                    border-radius: 8px 8px 0 0;
                }
                
                .banco-menu-btn:hover:not(.active) {
                    background-color: #f8f9fa;
                }
                
                .banco-section {
                    padding: 20px 0;
                }
                
                .banco-dashboard {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }
                
                .dashboard-card {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    padding: 15px;
                    border-radius: 10px;
                    text-align: center;
                    border: 1px solid #dee2e6;
                }
                
                .dashboard-card h5 {
                    margin: 0 0 10px 0;
                    font-size: 12px;
                    color: #6c757d;
                }
                
                .dashboard-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                }
                
                .banco-generate-btn {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.3s ease;
                }
                
                .banco-generate-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                }
                
                .banco-order-success {
                    text-align: center;
                    padding: 30px;
                }
                
                .order-details {
                    display: flex;
                    gap: 20px;
                    margin: 20px 0;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                
                .order-info {
                    flex: 1;
                    text-align: left;
                }
                
                .qr-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                
                .qr-code {
                    width: 80px;
                    height: 80px;
                    background: #007bff;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 30px;
                    border-radius: 10px;
                }
                
                .banco-copy-btn, .banco-new-order-btn {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    margin: 5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .banco-new-order-btn {
                    background: #007bff;
                }
                
                .banco-copy-btn:hover, .banco-new-order-btn:hover {
                    transform: translateY(-1px);
                    opacity: 0.9;
                }
                
                .banco-orders-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .order-item {
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 10px;
                    transition: all 0.3s ease;
                }
                
                .order-item:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .order-code {
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    color: #007bff;
                }
                
                .order-status {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                
                .order-status.pendiente {
                    background-color: #fff3cd;
                    color: #856404;
                }
                
                .order-status.pagado {
                    background-color: #d4edda;
                    color: #155724;
                }
                
                .order-status.vencido {
                    background-color: #f8d7da;
                    color: #721c24;
                }
                
                .order-details p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                
                .loading {
                    text-align: center;
                    color: #6c757d;
                    padding: 20px;
                }
            </style>
        `;
        
        if (!document.getElementById('banco-payment-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    createWidget() {
        const overlay = document.createElement('div');
        overlay.className = 'banco-payment-overlay';
        overlay.id = 'banco-payment-overlay';
        
        overlay.innerHTML = `
            <div class="banco-payment-modal">
                <div class="banco-payment-header">
                    <button class="banco-payment-close" onclick="bancoPayment.close()">&times;</button>
                    <h2 class="banco-payment-title">Pago Seguro</h2>
                    <p class="banco-payment-subtitle">Banco GT - Procesamiento seguro</p>
                </div>
                
                <!-- Pantalla de formulario -->
                <div class="banco-payment-body" id="banco-form-screen">
                    <div class="banco-payment-amount">
                        <div class="banco-payment-amount-label">Total a pagar</div>
                        <div class="banco-payment-amount-value" id="banco-amount-display">$0.00</div>
                    </div>
                    
                    <div id="banco-error-container"></div>
                    
                    <form id="banco-payment-form">
                        <div class="banco-form-group">
                            <label class="banco-form-label" for="cardNumber">Número de Tarjeta</label>
                            <input type="text" id="cardNumber" class="banco-form-input" placeholder="1234 5678 9012 3456" maxlength="19" required>
                        </div>
                        
                        <div class="banco-form-row">
                            <div class="banco-form-col">
                                <label class="banco-form-label" for="expDate">Vencimiento</label>
                                <input type="text" id="expDate" class="banco-form-input" placeholder="MM/AA" maxlength="5" required>
                            </div>
                            <div class="banco-form-col">
                                <label class="banco-form-label" for="cvv">CVV</label>
                                <input type="text" id="cvv" class="banco-form-input" placeholder="123" maxlength="4" required>
                            </div>
                        </div>
                        
                        <button type="submit" id="banco-pay-button" class="banco-payment-button">
                            Pagar Ahora
                        </button>
                    </form>
                    
                    <div class="banco-security-info">
                        <span class="banco-security-icon">🔒</span>
                        Sus datos están protegidos con encriptación SSL
                    </div>
                </div>

                <!-- 🎉 Nueva pantalla de éxito -->
                <div class="banco-success-screen" id="banco-success-screen">
                    <div class="banco-success-animation" id="banco-confetti-container"></div>
                    
                    <div class="banco-success-icon">
                        <div class="banco-success-checkmark">✓</div>
                    </div>
                    
                    <h3 class="banco-success-title">¡Pago Exitoso!</h3>
                    <p class="banco-success-message">Su transacción ha sido procesada correctamente.</p>
                    
                    <div class="banco-transaction-details" id="banco-transaction-details">
                        <!-- Los detalles se llenarán dinámicamente -->
                    </div>
                    
                    <div class="banco-success-actions">
                        <button class="banco-btn-secondary" onclick="bancoPayment.close()">
                            Cerrar
                        </button>
                        <button class="banco-btn-primary" onclick="bancoPayment.downloadReceipt()">
                            📄 Descargar Comprobante
                        </button>
                    </div>
                    
                    <div class="banco-success-footer">
                        <p>Transacción procesada por Banco GT<br>
                        Sus datos están seguros y protegidos</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        window.bancoPayment = this; // Hacer disponible globalmente
    }

    attachEvents() {
        const form = document.getElementById('banco-payment-form');
        const cardInput = document.getElementById('cardNumber');
        const expInput = document.getElementById('expDate');
        const cvvInput = document.getElementById('cvv');

        // Formatear número de tarjeta
        cardInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });

        // Formatear fecha de vencimiento
        expInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });

        // Solo números en CVV
        cvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });

        // Submit del formulario
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPayment();
        });

        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Cerrar al hacer click fuera del modal
        document.getElementById('banco-payment-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'banco-payment-overlay') {
                this.close();
            }
        });
    }

    open(amount) {
        this.isOpen = true;
        this.currentAmount = amount;
        document.getElementById('banco-amount-display').textContent = `$${amount.toFixed(2)}`;
        document.getElementById('banco-payment-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Asegurar que se muestre el formulario
        this.showFormScreen();
        
        // Focus en el primer input
        setTimeout(() => {
            document.getElementById('cardNumber').focus();
        }, 300);
    }

    close() {
        this.isOpen = false;
        document.getElementById('banco-payment-overlay').style.display = 'none';
        document.body.style.overflow = '';
        this.clearForm();
        this.showFormScreen(); // Resetear a la pantalla del formulario
        this.config.onCancel();
    }

    showFormScreen() {
        document.getElementById('banco-form-screen').style.display = 'block';
        document.getElementById('banco-success-screen').style.display = 'none';
    }

    showSuccessScreen(result) {
        document.getElementById('banco-form-screen').style.display = 'none';
        document.getElementById('banco-success-screen').style.display = 'block';
        
        // Llenar detalles de la transacción
        const detailsContainer = document.getElementById('banco-transaction-details');
        const now = new Date();
        
        detailsContainer.innerHTML = `
            <div class="banco-detail-row">
                <span class="banco-detail-label">ID de Transacción:</span>
                <span class="banco-detail-value">#${result.transactionId}</span>
            </div>
            <div class="banco-detail-row">
                <span class="banco-detail-label">Monto:</span>
                <span class="banco-detail-value">$${this.currentAmount.toFixed(2)}</span>
            </div>
            <div class="banco-detail-row">
                <span class="banco-detail-label">Fecha:</span>
                <span class="banco-detail-value">${now.toLocaleDateString()} ${now.toLocaleTimeString()}</span>
            </div>
            <div class="banco-detail-row">
                <span class="banco-detail-label">Comercio:</span>
                <span class="banco-detail-value">${this.config.merchantId}</span>
            </div>
            <div class="banco-detail-row">
                <span class="banco-detail-label">Estado:</span>
                <span class="banco-detail-value">✅ Aprobado</span>
            </div>
        `;
        
        // Agregar confetti
        this.createConfetti();
        
        // Guardar datos para el comprobante
        this.lastTransaction = {
            ...result,
            amount: this.currentAmount,
            date: now,
            merchantId: this.config.merchantId
        };
    }

    createConfetti() {
        const container = document.getElementById('banco-confetti-container');
        container.innerHTML = ''; // Limpiar confetti anterior
        
        // Crear 50 piezas de confetti
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'banco-confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
        }
        
        // Limpiar confetti después de 5 segundos
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    downloadReceipt() {
        if (!this.lastTransaction) return;
        
        const receipt = `
BANCO GT - COMPROBANTE DE PAGO
═══════════════════════════════════════

ID Transacción: ${this.lastTransaction.transactionId}
Fecha: ${this.lastTransaction.date.toLocaleString()}
Comercio: ${this.lastTransaction.merchantId}
Monto: $${this.lastTransaction.amount.toFixed(2)}
Estado: APROBADO

═══════════════════════════════════════
Gracias por usar Banco GT
Sus datos están protegidos
        `;
        
        const blob = new Blob([receipt], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante_${this.lastTransaction.transactionId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    clearForm() {
        document.getElementById('banco-payment-form').reset();
        document.getElementById('banco-error-container').innerHTML = '';
    }

    showError(message) {
        document.getElementById('banco-error-container').innerHTML = `
            <div class="banco-error">${message}</div>
        `;
    }

    async processPayment() {
        const button = document.getElementById('banco-pay-button');
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expDate = document.getElementById('expDate').value;
        const cvv = document.getElementById('cvv').value;
        const amount = parseFloat(document.getElementById('banco-amount-display').textContent.replace('$', ''));

        // Validaciones básicas
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            this.showError('Número de tarjeta inválido');
            return;
        }

        if (!/^\d{2}\/\d{2}$/.test(expDate)) {
            this.showError('Formato de fecha inválido (MM/AA)');
            return;
        }

        if (cvv.length < 3 || cvv.length > 4) {
            this.showError('CVV inválido');
            return;
        }

        // Mostrar loading
        button.disabled = true;
        button.innerHTML = '<span class="banco-loading"></span>Procesando...';
        this.showError('');

        try {
            const response = await fetch(`${this.config.apiUrl}/api/v1/pagos/charge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    merchantId: this.config.merchantId,
                    cardNumber,
                    amount,
                    expDate,
                    cvv
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // 🎉 Mostrar pantalla de éxito decorada
                this.showSuccessScreen(result);
                this.config.onSuccess(result);
            } else {
                this.showError(result.message || 'Error al procesar el pago');
            }
        } catch (error) {
            console.error('Error de pago:', error);
            this.showError('Error de conexión. Intente nuevamente.');
        } finally {
            button.disabled = false;
            button.innerHTML = 'Pagar Ahora';
        }
    }

    createPaymentWidget() {
        return `
            <div class="banco-overlay">
                <div class="banco-modal">
                    <div class="banco-header">
                        <h3>🏦 Banco GT - Pago Seguro</h3>
                        <button class="banco-close">&times;</button>
                    </div>
                    <div class="banco-content">
                        <div class="banco-form-screen">
                            <form class="banco-payment-form">
                                <div class="banco-field">
                                    <label>Número de Tarjeta</label>
                                    <input type="text" name="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
                                </div>
                                <div class="banco-row">
                                    <div class="banco-field">
                                        <label>Vencimiento</label>
                                        <input type="text" name="expDate" placeholder="MM/YY" maxlength="5">
                                    </div>
                                    <div class="banco-field">
                                        <label>CVV</label>
                                        <input type="text" name="cvv" placeholder="123" maxlength="4">
                                    </div>
                                </div>
                                <div class="banco-amount-display">
                                    <div class="amount-label">Total a pagar:</div>
                                    <div class="amount-value">Q <span class="amount-number">0.00</span></div>
                                </div>
                                <button type="submit" class="banco-pay-btn">
                                    🔒 Pagar Ahora
                                </button>
                            </form>
                        </div>
                        <div class="banco-success-screen" style="display: none;">
                            <div class="success-animation">
                                <div class="checkmark">✓</div>
                            </div>
                            <h3>¡Pago Exitoso!</h3>
                            <div class="transaction-details">
                                <p><strong>ID Transacción:</strong> <span class="transaction-id"></span></p>
                                <p><strong>Monto:</strong> Q <span class="transaction-amount"></span></p>
                                <p><strong>Fecha:</strong> <span class="transaction-date"></span></p>
                            </div>
                            <button class="banco-download-btn">📄 Descargar Comprobante</button>
                            <button class="banco-done-btn">Finalizar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createBusinessWidget() {
        return `
            <div class="banco-overlay">
                <div class="banco-modal banco-business-modal">
                    <div class="banco-header">
                        <h3>🏢 Banco GT - Panel de Negocio</h3>
                        <button class="banco-close">&times;</button>
                    </div>
                    <div class="banco-content">
                        <div class="banco-business-menu">
                            <button class="banco-menu-btn active" data-section="generate">
                                🧾 Generar Orden de Pago
                            </button>
                            <button class="banco-menu-btn" data-section="orders">
                                📋 Ver Órdenes
                            </button>
                            <button class="banco-menu-btn" data-section="dashboard">
                                📊 Dashboard
                            </button>
                        </div>
                        
                        <!-- Generar Orden de Pago -->
                        <div class="banco-section" id="generate-section">
                            <h4>Crear Nueva Orden de Pago</h4>
                            <form class="banco-order-form">
                                <div class="banco-field">
                                    <label>Monto (Q)</label>
                                    <input type="number" name="monto" placeholder="0.00" step="0.01" required>
                                </div>
                                <div class="banco-field">
                                    <label>Concepto</label>
                                    <input type="text" name="concepto" placeholder="Ej: Factura #001234" required>
                                </div>
                                <div class="banco-field">
                                    <label>Vigencia (horas)</label>
                                    <select name="vigenciaHoras">
                                        <option value="24">24 horas</option>
                                        <option value="48">48 horas</option>
                                        <option value="72">72 horas</option>
                                        <option value="168">1 semana</option>
                                    </select>
                                </div>
                                <button type="submit" class="banco-generate-btn">
                                    ✨ Generar Orden
                                </button>
                            </form>
                        </div>

                        <!-- Ver Órdenes -->
                        <div class="banco-section" id="orders-section" style="display: none;">
                            <h4>Órdenes de Pago Generadas</h4>
                            <div class="banco-orders-list">
                                <div class="loading">Cargando órdenes...</div>
                            </div>
                        </div>

                        <!-- Dashboard -->
                        <div class="banco-section" id="dashboard-section" style="display: none;">
                            <h4>Resumen de Actividad</h4>
                            <div class="banco-dashboard">
                                <div class="dashboard-card">
                                    <h5>💰 Saldo Actual</h5>
                                    <div class="dashboard-value">Q <span id="saldo-actual">0.00</span></div>
                                </div>
                                <div class="dashboard-card">
                                    <h5>🧾 Órdenes Pendientes</h5>
                                    <div class="dashboard-value"><span id="ordenes-pendientes">0</span></div>
                                </div>
                                <div class="dashboard-card">
                                    <h5>💳 Pagos Hoy</h5>
                                    <div class="dashboard-value"><span id="pagos-hoy">0</span></div>
                                </div>
                                <div class="dashboard-card">
                                    <h5>📈 Ingresos Hoy</h5>
                                    <div class="dashboard-value">Q <span id="ingresos-hoy">0.00</span></div>
                                </div>
                            </div>
                        </div>

                        <!-- Resultado de Orden Generada -->
                        <div class="banco-order-success" style="display: none;">
                            <div class="success-animation">
                                <div class="checkmark">✓</div>
                            </div>
                            <h3>¡Orden Generada Exitosamente!</h3>
                            <div class="order-details">
                                <div class="order-info">
                                    <p><strong>Código:</strong> <span class="order-code"></span></p>
                                    <p><strong>Clave:</strong> <span class="order-key"></span></p>
                                    <p><strong>Monto:</strong> Q <span class="order-amount"></span></p>
                                    <p><strong>Vence:</strong> <span class="order-expires"></span></p>
                                </div>
                                <div class="qr-container">
                                    <div class="qr-code">📱</div>
                                    <p>Código QR para el cliente</p>
                                </div>
                            </div>
                            <button class="banco-copy-btn">📋 Copiar Datos</button>
                            <button class="banco-new-order-btn">➕ Nueva Orden</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupBusinessEventListeners() {
        const widget = document.getElementById(this.config.container);
        
        // Menu navigation
        const menuBtns = widget.querySelectorAll('.banco-menu-btn');
        const sections = widget.querySelectorAll('.banco-section');
        
        menuBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sectionId = btn.dataset.section + '-section';
                
                // Update active menu
                menuBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show selected section
                sections.forEach(s => s.style.display = 'none');
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
                
                // Load section data
                if (sectionId === 'dashboard-section') {
                    this.loadDashboard();
                } else if (sectionId === 'orders-section') {
                    this.loadOrders();
                }
            });
        });
        
        // Order form submission
        const orderForm = widget.querySelector('.banco-order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generatePaymentOrder(orderForm);
            });
        }
        
        // New order button
        const newOrderBtn = widget.querySelector('.banco-new-order-btn');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                this.showSection('generate');
            });
        }
        
        // Copy data button
        const copyBtn = widget.querySelector('.banco-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyOrderData();
            });
        }
    }
    
    async generatePaymentOrder(form) {
        const formData = new FormData(form);
        const orderData = {
            monto: parseFloat(formData.get('monto')),
            concepto: formData.get('concepto'),
            vigenciaHoras: parseInt(formData.get('vigenciaHoras'))
        };
        
        try {
            const response = await fetch(`${this.config.apiUrl}/api/v1/negocio/${this.config.merchantId}/generar-orden`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showOrderSuccess(result.data);
            } else {
                this.config.onError(result.message);
            }
        } catch (error) {
            this.config.onError('Error al generar orden de pago');
        }
    }
    
    showOrderSuccess(orderData) {
        const widget = document.getElementById(this.config.container);
        const sections = widget.querySelectorAll('.banco-section');
        sections.forEach(s => s.style.display = 'none');
        
        const successSection = widget.querySelector('.banco-order-success');
        successSection.style.display = 'block';
        
        // Fill order data
        successSection.querySelector('.order-code').textContent = orderData.codigoOrden;
        successSection.querySelector('.order-key').textContent = orderData.claveAcceso;
        successSection.querySelector('.order-amount').textContent = orderData.monto.toFixed(2);
        successSection.querySelector('.order-expires').textContent = 
            new Date(orderData.fechaVencimiento).toLocaleString();
        
        // Store order data for copying
        this.currentOrder = orderData;
    }
    
    async loadDashboard() {
        try {
            const response = await fetch(`${this.config.apiUrl}/api/v1/negocio/${this.config.merchantId}/dashboard`);
            const result = await response.json();
            
            if (result.success) {
                const widget = document.getElementById(this.config.container);
                widget.querySelector('#saldo-actual').textContent = result.data.saldoActual.toFixed(2);
                widget.querySelector('#ordenes-pendientes').textContent = result.data.ordenesPendientes;
                widget.querySelector('#pagos-hoy').textContent = result.data.pagosHoy;
                widget.querySelector('#ingresos-hoy').textContent = result.data.ingresosHoy.toFixed(2);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }
    
    async loadOrders() {
        try {
            const response = await fetch(`${this.config.apiUrl}/api/v1/negocio/${this.config.merchantId}/ordenes?limite=10`);
            const result = await response.json();
            
            const widget = document.getElementById(this.config.container);
            const ordersList = widget.querySelector('.banco-orders-list');
            
            if (result.success && result.data.ordenes.length > 0) {
                ordersList.innerHTML = result.data.ordenes.map(orden => `
                    <div class="order-item ${orden.estado.toLowerCase()}">
                        <div class="order-header">
                            <span class="order-code">${orden.codigoOrden}</span>
                            <span class="order-status ${orden.estado.toLowerCase()}">${orden.estado}</span>
                        </div>
                        <div class="order-details">
                            <p><strong>Monto:</strong> Q ${orden.monto.toFixed(2)}</p>
                            <p><strong>Concepto:</strong> ${orden.concepto}</p>
                            <p><strong>Creado:</strong> ${new Date(orden.fechaCreacion).toLocaleDateString()}</p>
                            ${orden.fechaPago ? `<p><strong>Pagado:</strong> ${new Date(orden.fechaPago).toLocaleDateString()}</p>` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                ordersList.innerHTML = '<p>No hay órdenes generadas</p>';
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }
    
    showSection(sectionName) {
        const widget = document.getElementById(this.config.container);
        const sections = widget.querySelectorAll('.banco-section, .banco-order-success');
        sections.forEach(s => s.style.display = 'none');
        
        const targetSection = widget.querySelector(`#${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Update menu
        const menuBtns = widget.querySelectorAll('.banco-menu-btn');
        menuBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionName);
        });
    }
    
    copyOrderData() {
        if (this.currentOrder) {
            const data = `Código: ${this.currentOrder.codigoOrden}\nClave: ${this.currentOrder.claveAcceso}\nMonto: Q ${this.currentOrder.monto.toFixed(2)}`;
            navigator.clipboard.writeText(data).then(() => {
                alert('Datos copiados al portapapeles');
            });
        }
    }

    // Actualizar setupEventListeners para manejar ambos modos
    setupEventListeners() {
        const widget = document.getElementById(this.config.container);
        
        // Close button
        const closeBtn = widget.querySelector('.banco-close');
        closeBtn.addEventListener('click', () => this.close());
        
        if (this.config.mode === 'business') {
            this.setupBusinessEventListeners();
        } else {
            // Payment form
            const paymentForm = widget.querySelector('.banco-payment-form');
            if (paymentForm) {
                paymentForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.processPayment(paymentForm);
                });
            }
            
            // Done button
            const doneBtn = widget.querySelector('.banco-done-btn');
            if (doneBtn) {
                doneBtn.addEventListener('click', () => this.close());
            }
            
            // Download button
            const downloadBtn = widget.querySelector('.banco-download-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => this.downloadReceipt());
            }
        }
    }
}

// Función helper para inicializar el widget
window.BancoPayment = function(config) {
    return new BancoPaymentWidget(config);
};
