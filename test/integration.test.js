#!/usr/bin/env node

/**
 * 🧪 Test de integración entre CartoLMM y magnumsmaster
 * Verifica que la comunicación API funcione correctamente
 */

import fetch from 'node-fetch';
import MagnusmasterAPI from '../src/api/magnusmasterAPI.js';
import { config } from '../src/config/config.js';

const TEST_CONFIG = {
    magnusmasterURL: process.env.BLOCKCHAIN_API_URL || process.env.BLOCKCHAIN_LOCAL_URL || config.blockchainLocalUrl || 'http://localhost:6001',
    cartolmmURL: `http://${config.host === '0.0.0.0' ? 'localhost' : (config.host || 'localhost')}:${config.port || 8080}`,
    timeoutMs: config.apiTimeout || 5000
};

class IntegrationTester {
    constructor() {
        this.magnusmasterAPI = new MagnusmasterAPI(TEST_CONFIG.magnusmasterURL);
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            tests: []
        };
    }

    /**
     * 🎯 Ejecutar test individual
     */
    async runTest(name, testFunction) {
        this.results.total++;
        console.log(`\n🧪 Ejecutando: ${name}`);
        
        try {
            const startTime = Date.now();
            const result = await Promise.race([
                testFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), TEST_CONFIG.timeoutMs)
                )
            ]);
            const duration = Date.now() - startTime;
            
            if (result.success) {
                this.results.passed++;
                console.log(`✅ ${name} - ${duration}ms`);
                this.results.tests.push({ name, status: 'PASS', duration, details: result });
            } else {
                this.results.failed++;
                console.log(`❌ ${name} - ${duration}ms: ${result.error}`);
                this.results.tests.push({ name, status: 'FAIL', duration, error: result.error });
            }
        } catch (error) {
            this.results.failed++;
            console.log(`💥 ${name} - Error: ${error.message}`);
            this.results.tests.push({ name, status: 'ERROR', error: error.message });
        }
    }

    /**
     * 🏥 Test: Verificar salud de magnumsmaster
     */
    async testMagnusmasterHealth() {
        const result = await this.magnusmasterAPI.checkHealth();
        return {
            success: result.connected,
            error: result.error,
            data: result.data
        };
    }

    /**
     * ⛓️ Test: Obtener bloques
     */
    async testGetBlocks() {
        const result = await this.magnusmasterAPI.getBlocks();
        return {
            success: result.success,
            error: result.error,
            blockCount: result.success ? result.data?.length : 0
        };
    }

    /**
     * 🏊‍♂️ Test: Obtener pool de transacciones
     */
    async testGetTransactionsPool() {
        const result = await this.magnusmasterAPI.getTransactionsPool();
        return {
            success: result.success,
            error: result.error,
            transactionCount: result.success ? result.data?.length : 0
        };
    }

    /**
     * 💰 Test: Obtener balance
     */
    async testGetBalance() {
        const result = await this.magnusmasterAPI.getWalletBalance();
        return {
            success: result.success,
            error: result.error,
            balance: result.success ? result.data : null
        };
    }

    /**
     * 📊 Test: Obtener información del sistema
     */
    async testGetSystemInfo() {
        const result = await this.magnusmasterAPI.getSystemInfo();
        return {
            success: result.success,
            error: result.error,
            systemInfo: result.success ? result.data : null
        };
    }

    /**
     * 📈 Test: Métricas del dashboard
     */
    async testGetDashboardMetrics() {
        const result = await this.magnusmasterAPI.getDashboardMetrics();
        return {
            success: result.success,
            error: result.error,
            metrics: result.success ? Object.keys(result.metrics || {}) : []
        };
    }

    /**
     * 🌐 Test: Endpoint de CartoLMM
     */
    async testCartoLMMEndpoint(endpoint) {
        try {
            const response = await fetch(`${TEST_CONFIG.cartolmmURL}${endpoint}`, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return {
                success: true,
                data: data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🚀 Ejecutar suite completa de tests
     */
    async runFullSuite() {
        console.log('🔥 INICIANDO TESTS DE INTEGRACIÓN');
        console.log('=====================================');
        console.log(`🎯 magnumsmaster: ${TEST_CONFIG.magnusmasterURL}`);
        console.log(`🎯 CartoLMM: ${TEST_CONFIG.cartolmmURL}`);
        console.log(`⏱️ Timeout: ${TEST_CONFIG.timeoutMs}ms`);

        // Tests de magnumsmaster
        await this.runTest('Salud de magnumsmaster', () => this.testMagnusmasterHealth());
        await this.runTest('Obtener bloques', () => this.testGetBlocks());
        await this.runTest('Pool de transacciones', () => this.testGetTransactionsPool());
        await this.runTest('Balance de wallet', () => this.testGetBalance());
        await this.runTest('Información del sistema', () => this.testGetSystemInfo());
        await this.runTest('Métricas del dashboard', () => this.testGetDashboardMetrics());

        // Tests de CartoLMM
        await this.runTest('CartoLMM /api/status', () => this.testCartoLMMEndpoint('/api/status'));
        await this.runTest('CartoLMM /api/blocks', () => this.testCartoLMMEndpoint('/api/blocks'));
        await this.runTest('CartoLMM /api/dashboard-metrics', () => this.testCartoLMMEndpoint('/api/dashboard-metrics'));
        await this.runTest('CartoLMM /api/magnumsmaster-status', () => this.testCartoLMMEndpoint('/api/magnumsmaster-status'));

        // Mostrar resumen
        this.showSummary();
    }

    /**
     * 📊 Mostrar resumen de tests
     */
    showSummary() {
        console.log('\n🏁 RESUMEN DE TESTS');
        console.log('=====================================');
        console.log(`✅ Exitosos: ${this.results.passed}`);
        console.log(`❌ Fallidos: ${this.results.failed}`);
        console.log(`📊 Total: ${this.results.total}`);
        console.log(`🎯 Tasa de éxito: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

        if (this.results.failed > 0) {
            console.log('\n💥 TESTS FALLIDOS:');
            this.results.tests
                .filter(test => test.status !== 'PASS')
                .forEach(test => {
                    console.log(`   - ${test.name}: ${test.error || 'Error desconocido'}`);
                });
        }

        console.log('\n🔗 ESTADO DE INTEGRACIÓN:');
        if (this.results.passed === this.results.total) {
            console.log('🎉 ¡Integración completamente funcional!');
        } else if (this.results.passed > 0) {
            console.log('⚠️ Integración parcial - algunos servicios no disponibles');
        } else {
            console.log('💥 Integración no funcional - verificar servicios');
        }

        console.log('=====================================');
        process.exit(this.results.failed > 0 ? 1 : 0);
    }
}

import path from 'path';
import { fileURLToPath } from 'url';

// Ejecutar tests si se llama directamente
const isDirectRun = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (isDirectRun) {
    const tester = new IntegrationTester();
    
    // Manejo de signals
    process.on('SIGINT', () => {
        console.log('\n⏹️ Tests interrumpidos por usuario');
        process.exit(1);
    });

    try {
        await tester.runFullSuite();
    } catch (error) {
        console.error('💥 Error fatal ejecutando tests:', error);
        process.exit(1);
    }
}

export default IntegrationTester;