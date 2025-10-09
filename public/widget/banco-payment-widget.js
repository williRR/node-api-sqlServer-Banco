/**
 * Banco GT - Widget de Pago
 * Versión: 1.0.0
 * Integración fácil para comercios electrónicos
 */

class BancoPaymentWidget {
    constructor(config) {
        this.config = {
            merchantId: config.merchantId,
            apiUrl: config.apiUrl || 'https://api-banco-sqlserver.fly.dev',
            theme: config.theme || 'default',
            onSuccess: config.onSuccess || function() {},
            onError: config.onError || function() {},
            onCancel: config.onCancel || function() {},
            container: config.container || 'banco-payment-widget',
            language: config.language || 'es'
        };
        
        this.isOpen = false;
        this.init();
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
                <div class="banco-payment-body">
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
        document.getElementById('banco-amount-display').textContent = `$${amount.toFixed(2)}`;
        document.getElementById('banco-payment-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
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
        this.config.onCancel();
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
                this.config.onSuccess(result);
                this.close();
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
}

// Función helper para inicializar el widget
window.BancoPayment = function(config) {
    return new BancoPaymentWidget(config);
};
