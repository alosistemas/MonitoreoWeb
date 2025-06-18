import { AlertCircle, Bell, CheckCircle, Clock, Globe, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import './website-monitor-dashboard.css';

const WebsiteMonitor = () => {
  const [websites, setWebsites] = useState([
    { id: 1, url: 'https://alosistemas.com', name: 'ALOSISTEMAS Principal', status: 'unknown', responseTime: 0, lastCheck: null, uptime: 100, category: 'alosistemas' },
    { id: 2, url: 'https://portal.alosistemas.com', name: 'Portal ALOSISTEMAS', status: 'unknown', responseTime: 0, lastCheck: null, uptime: 100, category: 'alosistemas' },
    { id: 3, url: 'https://cliente1.com', name: 'Cliente Demo 1', status: 'unknown', responseTime: 0, lastCheck: null, uptime: 100, category: 'clientes' },
    { id: 4, url: 'https://cliente2.com', name: 'Cliente Demo 2', status: 'unknown', responseTime: 0, lastCheck: null, uptime: 100, category: 'clientes' }
  ]);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('alosistemas');
  const [activeTab, setActiveTab] = useState('alosistemas');
  const [isChecking, setIsChecking] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [checkInterval, setCheckInterval] = useState(30); // segundos

  // Función para verificar el estado de una página
  const checkWebsite = async (website) => {
    try {
      const startTime = Date.now();
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(website.url)}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        return {
          status: 'online',
          responseTime,
          lastCheck: new Date().toISOString()
        };
      } else {
        return {
          status: 'offline',
          responseTime: 0,
          lastCheck: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        status: 'offline',
        responseTime: 0,
        lastCheck: new Date().toISOString()
      };
    }
  };

  // Función para verificar todos los sitios web
  const checkAllWebsites = useCallback(async () => {
    if (websites.length === 0) return;
    
    setIsChecking(true);
    const updatedWebsites = [];
    
    for (const website of websites) {
      const result = await checkWebsite(website);
      const updatedWebsite = {
        ...website,
        ...result,
        uptime: result.status === 'online' ? 
          Math.min(100, website.uptime + 0.1) : 
          Math.max(0, website.uptime - 5)
      };
      
      // Generar alerta si el sitio se cayó
      if (website.status === 'online' && result.status === 'offline') {
        const alert = {
          id: Date.now(),
          message: `🚨 ${website.name} (${website.url}) está OFFLINE`,
          timestamp: new Date().toLocaleString(),
          type: 'error'
        };
        setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Mantener solo 10 alertas
        
        // Mostrar notificación del navegador si está permitido
        if (Notification.permission === 'granted') {
          new Notification(`Sitio Caído: ${website.name}`, {
            body: `${website.url} no está respondiendo`,
            icon: '🚨'
          });
        }
      }
      
      // Alerta de recuperación
      if (website.status === 'offline' && result.status === 'online') {
        const alert = {
          id: Date.now(),
          message: `✅ ${website.name} (${website.url}) está de vuelta ONLINE`,
          timestamp: new Date().toLocaleString(),
          type: 'success'
        };
        setAlerts(prev => [alert, ...prev.slice(0, 9)]);
      }
      
      updatedWebsites.push(updatedWebsite);
    }
    
    setWebsites(updatedWebsites);
    setIsChecking(false);
  }, [websites]);

  // Solicitar permisos de notificación
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Configurar monitoreo automático
  useEffect(() => {
    const interval = setInterval(checkAllWebsites, checkInterval * 1000);
    return () => clearInterval(interval);
  }, [checkAllWebsites, checkInterval]);

  // Verificación inicial
  useEffect(() => {
    checkAllWebsites();
  }, []);

  const addWebsite = () => {
    if (newUrl && newName) {
      const newWebsite = {
        id: Date.now(),
        url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`,
        name: newName,
        status: 'unknown',
        responseTime: 0,
        lastCheck: null,
        uptime: 100,
        category: newCategory
      };
      setWebsites([...websites, newWebsite]);
      setNewUrl('');
      setNewName('');
    }
  };

  const removeWebsite = (id) => {
    setWebsites(websites.filter(w => w.id !== id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-5 h-5" />;
      case 'offline': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  // Filtrar sitios web por categoría
  const filteredWebsites = websites.filter(website => website.category === activeTab);
  
  // Estadísticas por categoría
  const getStatsForCategory = (category) => {
    const categoryWebsites = websites.filter(w => w.category === category);
    return {
      total: categoryWebsites.length,
      online: categoryWebsites.filter(w => w.status === 'online').length,
      offline: categoryWebsites.filter(w => w.status === 'offline').length,
      avgUptime: categoryWebsites.length > 0 ? 
        Math.round(categoryWebsites.reduce((acc, w) => acc + w.uptime, 0) / categoryWebsites.length) : 0
    };
  };

  const currentStats = getStatsForCategory(activeTab);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Monitor de Páginas Web</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Intervalo:</label>
                <select 
                  value={checkInterval} 
                  onChange={(e) => setCheckInterval(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </select>
              </div>
              <button
                onClick={checkAllWebsites}
                disabled={isChecking}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Verificando...' : 'Verificar Ahora'}
              </button>
            </div>
          </div>

          {/* Estadísticas generales */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-800 text-sm font-medium">Online</div>
              <div className="text-2xl font-bold text-green-900">
                {currentStats.online}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-red-800 text-sm font-medium">Offline</div>
              <div className="text-2xl font-bold text-red-900">
                {currentStats.offline}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-gray-800 text-sm font-medium">Total</div>
              <div className="text-2xl font-bold text-gray-900">{currentStats.total}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-800 text-sm font-medium">Uptime Promedio</div>
              <div className="text-2xl font-bold text-blue-900">
                {currentStats.avgUptime}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de sitios web */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Sitios Web Monitoreados</h2>
                </div>
                
                {/* Pestañas */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('alosistemas')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'alosistemas'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                     ALOSISTEMAS ({getStatsForCategory('alosistemas').total})
                  </button>
                  <button
                    onClick={() => setActiveTab('clientes')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'clientes'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                     CLIENTES ({getStatsForCategory('clientes').total})
                  </button>
                </div>
              </div>
              
              {/* Formulario para agregar nuevo sitio */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex gap-3">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="alosistemas"> ALOSISTEMAS</option>
                    <option value="clientes"> CLIENTES</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Nombre del sitio"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="URL (ej: https://ejemplo.com)"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="flex-2 border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={addWebsite}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Lista de sitios */}
              <div className="divide-y">
                {filteredWebsites.map((website) => (
                  <div key={website.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getStatusColor(website.status)}`}>
                        {getStatusIcon(website.status)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{website.name}</div>
                        <div className="text-sm text-gray-600">{website.url}</div>
                        {website.lastCheck && (
                          <div className="text-xs text-gray-500">
                            Último check: {new Date(website.lastCheck).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Uptime: {Math.round(website.uptime)}%
                        </div>
                        {website.responseTime > 0 && (
                          <div className="text-xs text-gray-600">
                            {website.responseTime}ms
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeWebsite(website.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredWebsites.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    {activeTab === 'alosistemas' 
                      ? 'No hay sitios de ALOSISTEMAS configurados. Agrega uno arriba para comenzar.'
                      : 'No hay sitios de clientes configurados. Agrega uno arriba para comenzar.'
                    }
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel de alertas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Alertas Recientes</h2>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No hay alertas recientes
                  </div>
                ) : (
                  <div className="divide-y">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4">
                        <div className={`text-sm ${alert.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
                          {alert.message}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {alert.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Consejos:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Las notificaciones del navegador te alertarán cuando un sitio se caiga</li>
                <li>• El uptime se calcula basado en las verificaciones exitosas</li>
                <li>• Ajusta el intervalo según tus necesidades de monitoreo</li>
                <li>• Usa las pestañas para separar sitios de ALOSISTEMAS y clientes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteMonitor;