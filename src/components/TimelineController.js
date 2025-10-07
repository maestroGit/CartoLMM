/**
 * Timeline Controller para CartoLMM
 * Maneja la visualización temporal de eventos blockchain
 */

export class TimelineController {
    constructor(mapService, blockchainService) {
        this.mapService = mapService;
        this.blockchainService = blockchainService;
        this.isPlaying = false;
        this.currentTime = Date.now();
        this.playbackSpeed = 1;
        this.timeRange = {
            start: new Date(Date.now() - 86400000 * 30), // 30 días atrás
            end: new Date()
        };
        this.eventHistory = [];
        this.animationFrame = null;
        
        this.initializeControls();
        this.loadHistoricalData();
    }

    /**
     * Inicializar controles de la timeline
     */
    initializeControls() {
        // Botón play/pause
        const playButton = document.getElementById('play-pause');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.togglePlayback();
            });
        }

        // Slider de tiempo
        const timelineSlider = document.getElementById('timeline-slider');
        if (timelineSlider) {
            timelineSlider.addEventListener('input', (e) => {
                this.setTimePosition(parseInt(e.target.value));
            });
        }

        // Filtros
        this.setupFilters();
        
        console.log('🎬 Timeline Controller inicializado');
    }

    /**
     * Configurar filtros de región y tipo de vino
     */
    setupFilters() {
        const regionFilter = document.getElementById('region-filter');
        const wineTypeFilter = document.getElementById('wine-type-filter');

        if (regionFilter) {
            regionFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        if (wineTypeFilter) {
            wineTypeFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
    }

    /**
     * Cargar datos históricos
     */
    async loadHistoricalData() {
        try {
            // Simular datos históricos por ahora
            this.eventHistory = this.generateMockHistory();
            this.updateTimelineDisplay();
            console.log('📊 Datos históricos cargados:', this.eventHistory.length, 'eventos');
        } catch (error) {
            console.error('❌ Error cargando datos históricos:', error);
        }
    }

    /**
     * Generar historial mock para demo
     */
    generateMockHistory() {
        const events = [];
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        // Generar eventos de los últimos 30 días
        for (let i = 0; i < 100; i++) {
            const timestamp = thirtyDaysAgo + (Math.random() * (now - thirtyDaysAgo));
            
            events.push({
                id: `event_${i}`,
                timestamp: new Date(timestamp),
                type: this.getRandomEventType(),
                data: this.generateEventData(timestamp),
                region: this.getRandomRegion(),
                impact: Math.random() * 100
            });
        }

        return events.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Tipos de eventos aleatorios
     */
    getRandomEventType() {
        const types = [
            'wine_purchase',
            'new_block',
            'bodega_joined',
            'qr_verification',
            'bulk_sale',
            'quality_check',
            'harvest_started',
            'certification'
        ];
        return types[Math.floor(Math.random() * types.length)];
    }

    /**
     * Regiones aleatorias
     */
    getRandomRegion() {
        const regions = ['ribera', 'rioja', 'priorat', 'rias-baixas', 'jerez'];
        return regions[Math.floor(Math.random() * regions.length)];
    }

    /**
     * Generar datos específicos del evento
     */
    generateEventData(timestamp) {
        return {
            amount: Math.floor(Math.random() * 1000) + 10,
            bottles: Math.floor(Math.random() * 50) + 1,
            winery: `bodega_${Math.floor(Math.random() * 5) + 1}`,
            customer: `customer_${Math.floor(Math.random() * 100) + 1}`,
            wine_type: this.getRandomWineType(),
            vintage: 2020 + Math.floor(Math.random() * 4)
        };
    }

    /**
     * Tipos de vino aleatorios
     */
    getRandomWineType() {
        const types = ['tinto', 'blanco', 'rosado', 'espumoso'];
        return types[Math.floor(Math.random() * types.length)];
    }

    /**
     * Toggle reproducción
     */
    togglePlayback() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Iniciar reproducción
     */
    play() {
        this.isPlaying = true;
        this.updatePlayButton('⏸️');
        this.startAnimation();
        console.log('▶️ Timeline reproduciendo');
    }

    /**
     * Pausar reproducción
     */
    pause() {
        this.isPlaying = false;
        this.updatePlayButton('▶️');
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        console.log('⏸️ Timeline pausado');
    }

    /**
     * Actualizar botón play/pause
     */
    updatePlayButton(icon) {
        const playButton = document.getElementById('play-pause');
        if (playButton) {
            playButton.textContent = icon;
        }
    }

    /**
     * Iniciar animación de timeline
     */
    startAnimation() {
        const animate = () => {
            if (!this.isPlaying) return;

            this.currentTime += this.playbackSpeed * 60000; // 1 minuto por frame

            // Obtener eventos en el tiempo actual
            const currentEvents = this.getEventsAtTime(this.currentTime);
            
            // Visualizar eventos en el mapa
            this.visualizeEvents(currentEvents);
            
            // Actualizar displays
            this.updateTimelineDisplay();
            
            // Reiniciar si llegamos al final
            if (this.currentTime >= this.timeRange.end.getTime()) {
                this.currentTime = this.timeRange.start.getTime();
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Obtener eventos en un tiempo específico
     */
    getEventsAtTime(timestamp) {
        const timeWindow = 3600000; // 1 hora de ventana
        return this.eventHistory.filter(event => {
            const eventTime = event.timestamp.getTime();
            return eventTime >= timestamp - timeWindow && eventTime <= timestamp;
        });
    }

    /**
     * Visualizar eventos en el mapa
     */
    visualizeEvents(events) {
        events.forEach(event => {
            switch (event.type) {
                case 'wine_purchase':
                    this.animateTransaction(event);
                    break;
                case 'new_block':
                    this.animateBlockCreation(event);
                    break;
                case 'bodega_joined':
                    this.animateBodegaJoin(event);
                    break;
                case 'qr_verification':
                    this.animateQRVerification(event);
                    break;
            }
        });
    }

    /**
     * Animar transacción de vino
     */
    animateTransaction(event) {
        if (this.mapService) {
            // Crear efecto visual de transacción
            this.mapService.createTransactionEffect(event.data);
        }
    }

    /**
     * Animar creación de bloque
     */
    animateBlockCreation(event) {
        if (this.mapService) {
            this.mapService.createBlockEffect();
        }
    }

    /**
     * Animar nueva bodega
     */
    animateBodegaJoin(event) {
        console.log('🏢 Nueva bodega se une:', event.data.winery);
    }

    /**
     * Animar verificación QR
     */
    animateQRVerification(event) {
        console.log('📱 QR verificado:', event.data);
    }

    /**
     * Establecer posición temporal
     */
    setTimePosition(percentage) {
        const totalDuration = this.timeRange.end.getTime() - this.timeRange.start.getTime();
        this.currentTime = this.timeRange.start.getTime() + (totalDuration * percentage / 100);
        this.updateTimelineDisplay();
        
        // Si no está reproduciéndose, mostrar eventos de ese momento
        if (!this.isPlaying) {
            const currentEvents = this.getEventsAtTime(this.currentTime);
            this.visualizeEvents(currentEvents);
        }
    }

    /**
     * Actualizar display de la timeline
     */
    updateTimelineDisplay() {
        // Actualizar slider
        const slider = document.getElementById('timeline-slider');
        if (slider) {
            const percentage = ((this.currentTime - this.timeRange.start.getTime()) / 
                              (this.timeRange.end.getTime() - this.timeRange.start.getTime())) * 100;
            slider.value = Math.max(0, Math.min(100, percentage));
        }

        // Actualizar tiempo mostrado
        const timeDisplay = document.getElementById('timeline-time');
        if (timeDisplay) {
            const currentDate = new Date(this.currentTime);
            if (this.currentTime >= Date.now() - 60000) { // Último minuto
                timeDisplay.textContent = 'Tiempo Real';
            } else {
                timeDisplay.textContent = currentDate.toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }

        // Actualizar estadísticas
        this.updateTimelineStats();
    }

    /**
     * Actualizar estadísticas de la timeline
     */
    updateTimelineStats() {
        const currentEvents = this.getEventsAtTime(this.currentTime);
        const stats = this.calculateEventStats(currentEvents);
        
        // Enviar estadísticas al dashboard
        if (window.dashboardService) {
            window.dashboardService.updateTimelineStats(stats);
        }
    }

    /**
     * Calcular estadísticas de eventos
     */
    calculateEventStats(events) {
        return {
            totalEvents: events.length,
            transactions: events.filter(e => e.type === 'wine_purchase').length,
            blocks: events.filter(e => e.type === 'new_block').length,
            verifications: events.filter(e => e.type === 'qr_verification').length,
            totalValue: events.reduce((sum, e) => sum + (e.data.amount || 0), 0),
            regions: [...new Set(events.map(e => e.region))].length
        };
    }

    /**
     * Aplicar filtros de región y tipo
     */
    applyFilters() {
        const regionFilter = document.getElementById('region-filter')?.value;
        const wineTypeFilter = document.getElementById('wine-type-filter')?.value;

        // Filtrar eventos según selección
        let filteredEvents = this.eventHistory;

        if (regionFilter) {
            filteredEvents = filteredEvents.filter(e => e.region === regionFilter);
        }

        if (wineTypeFilter) {
            filteredEvents = filteredEvents.filter(e => 
                e.data.wine_type === wineTypeFilter);
        }

        console.log('🔍 Filtros aplicados:', {
            region: regionFilter,
            wineType: wineTypeFilter,
            events: filteredEvents.length
        });

        // Actualizar visualización con eventos filtrados
        this.eventHistory = filteredEvents;
        this.updateTimelineDisplay();
    }

    /**
     * Saltar a momento específico
     */
    jumpToTime(timestamp) {
        this.currentTime = timestamp;
        this.updateTimelineDisplay();
        
        const events = this.getEventsAtTime(timestamp);
        this.visualizeEvents(events);
        
        console.log('⏭️ Saltando a:', new Date(timestamp));
    }

    /**
     * Cambiar velocidad de reproducción
     */
    setPlaybackSpeed(speed) {
        this.playbackSpeed = speed;
        console.log('⚡ Velocidad cambiada a:', speed + 'x');
    }

    /**
     * Exportar datos de timeline
     */
    exportTimelineData() {
        const data = {
            timeRange: this.timeRange,
            events: this.eventHistory,
            stats: this.calculateEventStats(this.eventHistory)
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], 
                             { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `cartolmm-timeline-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📁 Datos de timeline exportados');
    }
}

// Instancia global
window.timelineController = null;