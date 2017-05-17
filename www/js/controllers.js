angular.module('starter.controllers', [])

.controller('TabsCtrl', function($rootScope, $scope, $localStorage, $state, $ionicPopup) {

  if (!$localStorage.estacionamento) {
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

  $scope.registrarSaida = function() {
    $cordovaBarcodeScanner.scan().then(function(imageData){
      var dadosQrCode = JSON.parse(imageData.text);
      if (dadosQrCode.sistema == 'estacionar') {
        var entrada = $localStorage.entradas.filter(function(value){return value.cartao == dadosQrCode.cartao && !value.datahora_saida});

        if (entrada.length > 0) {
          var registro_entrada = entrada[0];
          var dataHoraSaida = new Date();
          var diferencaMinutos = Math.abs(dataHoraSaida - registro_entrada.datahora_entrada)/1000/60;
          
          var totalAPagar = $localStorage.estacionamento.carro.valor_primeira_hora;
          if (diferencaMinutos > 60) {
            totalAPagar += (diferencaMinutos/60) * $localStorage.estacionamento.carro.valor_hora_adicional;
          }

          registro_entrada.datahora_saida = dataHoraSaida;
          registro_entrada.total_tempo = diferencaMinutos;
          registro_entrada.total_pagar = totalAPagar;

          $scope.saida = registro_entrada;

          var confirmPopup = $ionicPopup.show({
            title: 'Estacionar',
            subTitle: 'Confirmar saída?',
            templateUrl: './templates/tab-final.html',
            scope: $scope,
            buttons: [{
              text: 'Não',
              type: 'button-default',
              onTap: function(e) {
                  registro_entrada.datahora_saida = undefined;
                  registro_entrada.total_tempo = undefined;
                  registro_entrada.total_pagar = undefined;
                  $scope.saida = undefined;
                }
              }, {
                text:'Sim',
                type: 'button-positive',
                onTap: function(e) {
                  $localStorage.entradas.push(registro_entrada);

                  $ionicPopup.alert({
                    title: 'Estacionar',
                    cssClass: 'text-center',
                    template: 'Saída realizada com sucesso.'
                  });
                }
              }
            ]
          });

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
})

.controller('EntradaCtrl', function($scope, $localStorage, $cordovaBarcodeScanner, $ionicPopup, $ionicLoading, $state) {
  
  $scope.container = {
    veiculo: 'carro'
  };
  $scope.placa = {};
  $scope.letras = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  $scope.numeros = [0,1,2,3,4,5,6,7,8,9];

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.entrada') {
        $scope.container = {
          veiculo: 'carro',
          placa: null,
          datahora_entrada: new Date()
        };
        $scope.placa = {};
      }
    }
  );

  $scope.lerCartao = function() {
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
      if (dadosQrCode.sistema == 'estacionar') {
        $scope.container.cartao = dadosQrCode.cartao;
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

    var popup = $ionicPopup.alert({
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

})

.controller('ConfiguracoesCtrl', function($scope, $localStorage, $ionicPopup, $ionicLoading, $state, $rootScope) {
  
  $scope.usuario = $localStorage.usuario || {};
  $scope.container = $localStorage.estacionamento || {};

  $scope.salvar = function() {
    
    //Executa o loading
    $ionicLoading.show({});

    $localStorage.estacionamento = $scope.container;
    $rootScope.estacionamento = $scope.container;
    $localStorage.entradas = [];

    var popup = $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Configurações salvas com sucesso. Agora você pode registrar entradas e saídas de carros. Em caso de dúvidas ou sugestões, entre em contato com o suporte técnico.'
    });
    
    //Finaliza o loading
    $ionicLoading.hide();

    popup.then(function(res){
      $state.go('tab.inicio');
    });
  }

});
