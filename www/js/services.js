angular.module('starter.services', [])

.service('UsuarioService', function($http, ESTACIONAR_CONFIG) {
  
  this.autenticarUsuario = function(data) {
    var senhaEncriptada = CryptoJS.SHA256(data.senha).toString();
    var usuario = {
    	usuario: {
    		login: data.login,
    		senha: senhaEncriptada
    	}
    }
    return $http.post(ESTACIONAR_CONFIG.SERVIDOR + "/usuarios/autenticarUsuario", usuario);
  }
})

.service('EstacionamentoService', function($http, ESTACIONAR_CONFIG) {
  
  this.listarEstacionamentosPorIdUsuario = function(id_usuario) {
    return $http.get(ESTACIONAR_CONFIG.SERVIDOR + "/estacionamentos/" + id_usuario);
  }

  this.listarValoresEstacionamentoPorId = function(id) {
    return $http.get(ESTACIONAR_CONFIG.SERVIDOR + "/estacionamentos/" + id + "/valores");
  }

  this.listarEntradasPorId = function(id) {
    return $http.get(ESTACIONAR_CONFIG.SERVIDOR + '/estacionamentos/' + id + "/entradas");
  }

  this.salvarEstacionamento = function(estacionamento) {
    return $http.post(ESTACIONAR_CONFIG.SERVIDOR + "/estacionamentos", estacionamento);
  }
})

.service('TipoVeiculoService', function($http, ESTACIONAR_CONFIG) {
  
  this.listarTiposVeiculos = function(id_usuario) {
    return $http.get(ESTACIONAR_CONFIG.SERVIDOR + "/tiposVeiculos");
  }

})

.service('EntradaService', function($http, ESTACIONAR_CONFIG) {
  
  this.salvar = function(entrada) {
    delete entrada.total_tempo_formatado;
    var data = {
      entrada: entrada
    }
    if (data.entrada.id) {
      return $http.put(ESTACIONAR_CONFIG.SERVIDOR + "/entradas", data);
    } else {
      return $http.post(ESTACIONAR_CONFIG.SERVIDOR + "/entradas", data);
    }
  }

});
