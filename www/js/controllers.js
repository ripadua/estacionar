angular.module('starter.controllers', [])

.controller('TabsCtrl', function($rootScope, $scope, $localStorage, $state, $ionicPopup) {

  if (!$localStorage.estacionamento) {
    $localStorage.entradas = [];
    $localStorage.despesas = [];

    var popup = $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Bem vindo ao Estacionar. Para utilizar o app é necessário configurar os dados do seu estacionamento.'
    });

    popup.then(function(res){
      $state.go('tab.configuracoes');
    });
  } else {
    if (!$localStorage.entradas) {
      $localStorage.entradas = [];
    }

    if (!$localStorage.despesas) {
      $localStorage.despesas = [];
    }

    $rootScope.estacionamento = $localStorage.estacionamento;
    $rootScope.estacionamento.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
  }
})

.controller('InicioCtrl', function($scope, $rootScope, $localStorage, $state, $cordovaBarcodeScanner, $ionicPopup) {

  $scope.saida = {};

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.inicio') {
        if ($rootScope.estacionamento) {
          $rootScope.estacionamento.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
        }
      }
    }
  );

  $scope.registrarEntrada = function() {
    $state.go('tab.entrada');
  }

  function registrarSaida(entrada, multa) {
    var dataHoraSaida = new Date();
    var diferencaMinutos = Math.abs(dataHoraSaida - new Date(entrada.datahora_entrada))/1000/60;
    diferencaMinutos = Math.round(diferencaMinutos);
    
    var totalAPagar = 0;
    var valor_primeira_hora = $localStorage.estacionamento[entrada.veiculo].valor_primeira_hora;
    var valor_hora_adicional = $localStorage.estacionamento[entrada.veiculo].valor_hora_adicional;

    if (diferencaMinutos > $localStorage.estacionamento.tolerancia) {
      totalAPagar += valor_primeira_hora;

      if (multa) {
        totalAPagar += $localStorage.estacionamento.multa_perda_cartao;
      }

      if (diferencaMinutos > 60) {
        totalAPagar += (diferencaMinutos/60) * valor_hora_adicional;
      }
    }

    entrada.datahora_saida = dataHoraSaida;
    entrada.total_tempo = diferencaMinutos;
    entrada.valor_pago = totalAPagar;
    entrada.total_pagar = totalAPagar;

    $scope.saida = entrada;

    var confirmPopup = $ionicPopup.show({
      title: 'Estacionar',
      subTitle: 'Confirmar saída?',
      templateUrl: './templates/tab-final.html',
      scope: $scope,
      buttons: [{
        text: 'Não',
        type: 'button-default',
        onTap: function(e) {
            entrada.datahora_saida = undefined;
            entrada.total_tempo = undefined;
            entrada.total_pagar = undefined;
            $scope.saida = undefined;
          }
        }, {
          text:'Sim',
          type: 'button-positive',
          onTap: function(e) {
            var popup = $ionicPopup.alert({
              title: 'Estacionar',
              cssClass: 'text-center',
              template: 'Saída realizada com sucesso.'
            });

            popup.then(function(res){
              $rootScope.estacionamento.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
            });
          }
        }
      ]
    });
  }

  $scope.registrarSaidaCartao = function() {

    $cordovaBarcodeScanner.scan().then(function(imageData){
      var dadosQrCode = JSON.parse(imageData.text);
      //var dadosQrCode = {"sistema":"estacionar","cartao":"1"};
      if (dadosQrCode.sistema == 'estacionar') {
        var entrada = $localStorage.entradas.filter(function(value){return value.cartao == dadosQrCode.cartao && !value.datahora_saida});

        if (entrada.length > 0) {
          registrarSaida(entrada[0], false);

        } else {
          $ionicPopup.alert({
            title: 'Estacionar',
            cssClass: 'text-center',
            template: 'Não foi realizada entrada do cartão lido. Por favor ler o cartão que foi entregue ao cliente.'
          });
        }
      } else {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'O QR code lido não é um código válido para o Estacionar. Por favor leia o cartão disponibilizado ou entre em contato com o suporte técnico.'
        });
      }
    });
  }

  $scope.registrarSaidaPlaca = function() {

    $scope.entrada = undefined;
    $scope.entradas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida});

    var confirmPopup = $ionicPopup.show({
      title: 'Estacionar',
      subTitle: 'Selecione a placa do carro:',
      templateUrl: './templates/template-perdeu-cartao.html',
      scope: $scope,
      buttons: [{
        text: 'Cancelar',
        type: 'button-default',
        onTap: function(e) {
          }
        }, {
          text:'Confirmar',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.entrada) {
              e.preventDefault();
              $ionicPopup.alert({
                title: 'Estacionar',
                cssClass: 'text-center',
                template: 'Selecione a placa para realizar a saída.'
              });
            } else {
              registrarSaida($scope.entrada, true);
            }
          }
        }
      ]
    });
  }

  $scope.alterarSelecaoPlaca = function(entradaSelecionada) {
    $scope.entrada = entradaSelecionada;
  }
})

.controller('EntradaCtrl', function($scope, $localStorage, $cordovaBarcodeScanner, $ionicPopup, $ionicLoading, $state) {
  
  $scope.possuiParametroCarro = function() {
    return $localStorage.estacionamento.carro && $localStorage.estacionamento.carro.valor_primeira_hora > 0;
  }

  $scope.possuiParametroCamionete = function() {
    return $localStorage.estacionamento.camionete && $localStorage.estacionamento.camionete.valor_primeira_hora > 0;
  }

  $scope.possuiParametroMoto = function() {
    return $localStorage.estacionamento.moto && $localStorage.estacionamento.moto.valor_primeira_hora > 0;
  }

  $scope.defineVeiculoPadrao = function() {
    var veiculoPadrao = "";
    if ($scope.possuiParametroCarro()) {
      veiculoPadrao = "carro";
    } else if ($scope.possuiParametroCamionete()) {
      veiculoPadrao = "camionete";
    } else if ($scope.possuiParametroMoto()){
      veiculoPadrao = "moto";
    }
    return veiculoPadrao;
  }

  $scope.container = {
    veiculo: $scope.defineVeiculoPadrao()
  };
  $scope.placa = {};
  
  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.entrada') {
        $scope.container = {
          veiculo: $scope.defineVeiculoPadrao(),
          placa: null,
          datahora_entrada: new Date()
        };
        $scope.placa = {};
      }
    }
  );

  $scope.lerCartao = function() {
    if (!$scope.container.veiculo) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe o tipo de veículo. Caso não estejam aparecendo as opções, será necessário definir os valores de cobrança na tela de configurações.'
      });
      return;
    }

    $scope.container.placa = "";
    for(var i = 1; i <= 7; i++) {
      if ($scope.placa['placa_'+i]) {
        $scope.container.placa += $scope.placa['placa_'+i];
      }
    }
    $scope.container.placa = $scope.container.placa.toUpperCase();

    if ($scope.container.placa.length < 7) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe a placa do carro completa para ler o código.'
      });
      return;
    }

    $cordovaBarcodeScanner.scan().then(function(imageData){
      var dadosQrCode = JSON.parse(imageData.text);
      //var dadosQrCode = {"sistema":"estacionar","cartao":"1"};
      if (dadosQrCode.sistema == 'estacionar') {
        $scope.container.cartao = dadosQrCode.cartao;

        var entrada = $localStorage.entradas.filter(function(value){return value.cartao == dadosQrCode.cartao && !value.datahora_saida});

        if (entrada.length > 0) {
          $ionicPopup.alert({
            title: 'Estacionar',
            cssClass: 'text-center',
            template: 'O QR code do cartão lido já está em uso. Por favor utilize outro cartão.'
          });
          return;
        }

        var date = new Date();
        $scope.container.datahora_entrada = date;

        $localStorage.entradas.push($scope.container);

        var dataHoraFormatada = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

        var popup = $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Entrada registrada com sucesso. Placa: ' + $scope.container.placa + ' - Data/Hora: ' + dataHoraFormatada
        });
        
        popup.then(function(res){
          $state.go('tab.inicio');
        });
      } else {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'O QR code lido não é um código válido para o Estacionar. Por favor leia o cartão disponibilizado ou entre em contato com o suporte técnico.'
        });
      }
    });
  }
  
})

.controller('DespesaCtrl', function($scope, $cordovaBarcodeScanner, $localStorage, $ionicPopup, $ionicLoading, $state) {

  $scope.container = {
    data: new Date()
  }

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.despesa') {
        $scope.container = {
          data: new Date()
        }
      }
    } 
  );

  $scope.salvar = function() {

    //Executa o loading
    $ionicLoading.show({});

    if (!$scope.container.descricao) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe a descrição da despesa.'
      });
      $ionicLoading.hide();
      return;
    }

    if (!$scope.container.valor) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe o valor da despesa.'
      });
      $ionicLoading.hide();
      return;
    }

    $localStorage.despesas.push($scope.container);

    $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Despesa registrada com sucesso.'
    });
    
    $scope.container = {
      data: new Date()
    }

    //Finaliza o loading
    $ionicLoading.hide();
  }

})

.controller('CaixaCtrl', function($scope, $localStorage) {
  
  $scope.data = new Date();
  $scope.data.setHours(0,0,0,0);
 
  calcularTotais();

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.caixa') {
        

        calcularTotais();
      }
    }
  );

  function calcularTotais() {
    $scope.receitas = [];
    $scope.despesas = [];
    $scope.receitas = $localStorage.entradas.filter(function(value){
      var dataEntrada = new Date(value.datahora_entrada);
      return value 
          && value.datahora_saida 
          && dataEntrada.getDate() == $scope.data.getDate()
          && dataEntrada.getMonth() == $scope.data.getMonth()
          && dataEntrada.getFullYear() == $scope.data.getFullYear();
    });
    $scope.despesas = $localStorage.despesas.filter(function(value){
      var dataDespesa = new Date(value.data);
      return value
          && value.data
          && dataDespesa.getDate() == $scope.data.getDate()
          && dataDespesa.getMonth() == $scope.data.getMonth()
          && dataDespesa.getFullYear() == $scope.data.getFullYear();
    });

    $scope.total_receitas = 0;
    $scope.total_despesas = 0;


    for(r in $scope.receitas) {
      $scope.total_receitas += $scope.receitas[r].total_pagar;
    }

    for(d in $scope.despesas) {
      $scope.total_despesas += $scope.despesas[d].valor;
    }

    $scope.total = $scope.total_receitas - $scope.total_despesas;
  }

  $scope.navegarDataAnterior = function() {
    $scope.data.setDate($scope.data.getDate()-1);
    calcularTotais();
  }

  $scope.navegarDataProxima = function() {
    $scope.data.setDate($scope.data.getDate()+1);
    calcularTotais();
  }

  $scope.mostrarDataProxima = function() {
    var dataAtual = new Date();
    return $scope.data.getDate() < dataAtual.getDate()
        && $scope.data.getMonth() <= dataAtual.getMonth()
        && $scope.data.getFullYear() <= dataAtual.getFullYear();
  }

  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

})

.controller('ConfiguracoesCtrl', function($scope, $localStorage, $ionicPopup, $ionicLoading, $state, $rootScope) {
  
  $scope.usuario = $localStorage.usuario || {};
  $scope.container = $localStorage.estacionamento || {};

  $scope.salvar = function() {
    
    //Executa o loading
    $ionicLoading.show({});

    $localStorage.estacionamento = $scope.container;
    $rootScope.estacionamento = $scope.container;

    var popup = $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Configurações salvas com sucesso.'
    });
    
    //Finaliza o loading
    $ionicLoading.hide();

    popup.then(function(res){
      $state.go('tab.inicio');
    });
  }

})

.controller('LoginCtrl', function($scope, $localStorage, $ionicPopup, $ionicLoading, $state, $rootScope, UsuarioService, ESTACIONAR_CONFIG) {

  $scope.data = {};

  $scope.versao = ESTACIONAR_CONFIG.VERSAO_APLICACAO;

  if($localStorage.usuario) {
    $state.go('tab.inicio');
  }

  $scope.entrar = function() {
    
    //Executa o loading
    $ionicLoading.show({});

    if (!$scope.data.login) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe o login para entrar no Estacionar.'
      });
      $ionicLoading.hide();
      return;
    }

    if (!$scope.data.senha) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe a senha para entrar no Estacionar.'
      });
      $ionicLoading.hide();
      return;
    }

    UsuarioService.autenticarUsuario($scope.data).then(function(response){
      
      $localStorage.usuario = response.data;

      $ionicLoading.hide();
      $state.go('tab.inicio');

    }, function(erro){
      if (erro.status == 401) {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Login ou senha inválidos. Verifique os dados informados e tente novamente.'
        });
      } else if (erro.status == 402) {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Pagamento pendente. Por favor entre em contato com o administrador do sistema.'
        });
      } else {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Ocorreu um erro ao entrar no sistema. Por favor tente novamente.'
        });
      }
      console.log(erro);
      $ionicLoading.hide();
    });

  }

});
