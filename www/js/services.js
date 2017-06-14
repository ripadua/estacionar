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

  this.listarDespesasPorId = function(id) {
    return $http.get(ESTACIONAR_CONFIG.SERVIDOR + '/estacionamentos/' + id + "/despesas");
  }

  this.salvar = function(estacionamento) {
    var data = {
      estacionamento: estacionamento
    }
    if (data.estacionamento.id) {
      return $http.put(ESTACIONAR_CONFIG.SERVIDOR + "/estacionamentos", data);
    } else {
      return $http.post(ESTACIONAR_CONFIG.SERVIDOR + "/estacionamentos", data);
    }
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
    entrada.datahora_entrada = entrada.datahora_entrada.toLocaleString();

    if (entrada.datahora_saida) {
      entrada.datahora_saida = entrada.datahora_saida.toLocaleString();      
    }

    var data = {
      entrada: entrada
    }
    if (data.entrada.id) {
      return $http.put(ESTACIONAR_CONFIG.SERVIDOR + "/entradas", data);
    } else {
      return $http.post(ESTACIONAR_CONFIG.SERVIDOR + "/entradas", data);
    }
  }

})

.service('DespesaService', function($http, ESTACIONAR_CONFIG) {
  
  this.salvar = function(despesa) {
    despesa.data = despesa.data.toLocaleString();
    var data = {
      despesa: despesa
    }
    if (data.despesa.id) {
      return $http.put(ESTACIONAR_CONFIG.SERVIDOR + "/despesas", data);
    } else {
      return $http.post(ESTACIONAR_CONFIG.SERVIDOR + "/despesas", data);
    }
  }

});
