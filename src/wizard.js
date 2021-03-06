angular.module('mgo-angular-wizard').directive('wizard', function() {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        scope: {
            currentStep: '=',
            onFinish: '&',
            hideIndicators: '=',
            editMode: '=',
            name: '@'
        },
        templateUrl: function(element, attributes) {
          return attributes.template || "wizard.html";
        },
        controller: ['$scope', '$element', 'WizardHandler', function($scope, $element, WizardHandler) {

            WizardHandler.addWizard($scope.name || WizardHandler.defaultName, this);
            $scope.$on('$destroy', function() {
                WizardHandler.removeWizard($scope.name || WizardHandler.defaultName);
            });

            $scope.steps = [];

            var stepIdx = function(step) {
                var idx = 0;
                var res = -1;
                angular.forEach($scope.steps, function(currStep) {
                  if (currStep === step) {
                    res = idx;
                  }
                  idx++;
                });
                return res;
            };

            var stepByTitle = function(titleToFind) {
              var foundStep = null;
              angular.forEach($scope.steps, function(step) {
                if (step.title === titleToFind) {
                  foundStep = step;
                }
              });
              return foundStep;
            };

            $scope.$watch('currentStep', function(step) {
                if (!step) return;
                var stepTitle = $scope.selectedStep.title || $scope.selectedStep.wzTitle;
                if ($scope.selectedStep && stepTitle !== $scope.currentStep) {
                    var foundStep = stepByTitle($scope.currentStep);
                    $scope.goTo(foundStep);
                }

            });

            $scope.$watch('[editMode, steps.length]', function() {
                var editMode = $scope.editMode;
                if (angular.isUndefined(editMode) || (editMode === null)) return;

                if (editMode) {
                    angular.forEach($scope.steps, function(step) {
                        step.completed = true;
                    });
                }
            }, true);

            this.addStep = function(step) {
                $scope.steps.push(step);
                if ($scope.steps.length === 1) {
                    $scope.goTo($scope.steps[0]);
                }
            };

            $scope.goTo = function(step) {
                unselectAll();
                $scope.selectedStep = step;
                if (!angular.isUndefined($scope.currentStep)) {
                    $scope.currentStep = step.title || step.wzTitle;
                }
                step.selected = true;
                $scope.$emit('wizard:stepChanged', {step: step, index: stepIdx(step)});
            };
            
            $scope.currentStepNumber = function() {
                return stepIdx($scope.selectedStep) + 1;
            };

            function unselectAll() {
                angular.forEach($scope.steps, function (step) {
                    step.selected = false;
                });
                $scope.selectedStep = null;
            }

            this.next = function(draft) {
                var index = stepIdx($scope.selectedStep);
                if (!draft) {
                    $scope.selectedStep.completed = true;
                }
                if (index === $scope.steps.length - 1) {
                    this.finish();
                } else {
                    $scope.goTo($scope.steps[index + 1]);
                }
            };

            this.goTo = function(step) {
                var stepTo;
                if (angular.isNumber(step)) {
                    stepTo = $scope.steps[step];
                } else {
                    stepTo = stepByTitle(step);
                }
                $scope.goTo(stepTo);
            };

            this.finish = function() {
                if ($scope.onFinish) {
                    $scope.onFinish();
                }
            };

            this.cancel = this.previous = function() {
                var index = stepIdx($scope.selectedStep);
                if (index === 0) {
                    throw new Error("Can't go back. It's already in step 0");
                } else {
                    $scope.goTo($scope.steps[index - 1]);
                }
            };
        }]
    };
});
