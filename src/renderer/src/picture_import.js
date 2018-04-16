'use strict';

angular.module('common').controller('PictureImportController', ['$scope', '$modalInstance', '$routeParams', '$http', 'parent', function($scope, $modalInstance, $routeParams, $http, parent) {
    $scope.systemPictures = [];
    $scope.uploadPictures = [];

    $scope.main_menu = "entrybot_friends";
    $scope.menu = "";

    $scope.searchWord = '';
    $scope.language = localStorage.getItem('lang') || 'ko';

    // 현재 선택한 탭
    $scope.currentTab = 'system'; //for modal(sprite,upload,paint,character,text,etc)

    $scope.selectedPictures = [];
    $scope.selectedUpload = [];
    $scope.currentIndex = 0;

    $scope.pictureData = {};
    $scope.orgPictureData = {};

    var calcInnerHeight = function() {
        var height = $(".tab-right").height();
        var rowCount = parseInt(height / 148);
        var count = (rowCount + 1) * 6;

        $scope.showCount = count;
    };

    $scope.init = function() {
        $routeParams.type = 'default';
        $routeParams.main = 'entrybot_friends';
        $scope.collapse(1);
        calcInnerHeight();

        $scope.findPictures($routeParams.type, $routeParams.main, $routeParams.sub);
    };


    var makePictureData = function(items) {
        $scope.orgPictureData = items;
        $scope.pictureData = {};
        items.forEach(function(item, index) {

            var category = '';
            if ('category' in item) {
                category = item.category.main;
            } else {
                category = 'default';
            }

            if (!Array.isArray($scope.pictureData[category])) {
                $scope.pictureData[category] = [];
            }

            $scope.pictureData[category].push(item);
        });
        sessionStorage.setItem("pictureData", JSON.stringify($scope.pictureData));
    }

    var getPictureData = function(main, sub) {
        var datas = $scope.pictureData[main];
        var data = [];
        if (sub) {
            datas.forEach(function(item, index) {
                if (item.category.sub === sub) {
                    data.push(item);
                }
            });
        } else {
            data = datas;
        }

        return data;
    }

    var setSystemPictures = function(type, main, sub) {
        var data = getPictureData(main, sub);
        $scope.systemPictures = [];
        for (var i in data) {
            var picture = data[i];
            picture.selected = 'boxOuter';
            for (var j in $scope.selectedPictures) {
                if ($scope.selectedPictures[j]._id === picture._id) {
                    picture.selected = 'boxOuter selected';
                    break;
                }
            }

            $scope.systemPictures.push(picture);
        }
    }

    var sortPictureData = function(response) {
        response = response.sort(function(a, b) {
            if (a.name > b.name) {
                return 1;
            } else if (a.name < b.name) {
                return -1;
            } else {
                return 0;
            }
        });
    }

    $scope.findPictures = function(type, main, sub) {
        calcInnerHeight();

        if (main) {
            $scope.main_menu = main;
            if (sub) {
                $scope.menu = sub;
            } else {
                $scope.menu = '';
            }
        }
        if ($.isEmptyObject($scope.pictureData)) {
            var pictureData = sessionStorage.getItem("pictureData");
            pictureData = pictureData ? JSON.parse(pictureData) : {};
            if ($.isEmptyObject(pictureData)) {
                const response = require('./resource_map/pictures.json');
                sortPictureData(response);
                makePictureData(response);
                setSystemPictures(type, main, sub);
            } else {
                $scope.pictureData = pictureData;
                setSystemPictures(type, main, sub);
            }
        } else {
            setSystemPictures(type, main, sub);
        }
    };

    var filterPictureData = function(keyword, cb) {
        var filtered_data = [];
        if ($scope.language === 'ko') {
            var categories = Object.keys($scope.pictureData);
            for (var i = 0, len = categories.length; i < len; i++) {
                var current = categories[i];
                var result = $scope.pictureData[current].filter(function(item) {
                    return item.name && item.name.indexOf(keyword.name) > -1
                });

                if (result && result.length > 0) {
                    result.forEach(function(d) {
                        filtered_data.push(d);
                    });
                }
            }
        } else {
            var keys = Object.keys(PictureNames);
            var resultKeys = keys.filter(function(key) {
                return PictureNames[key].toLowerCase().indexOf(keyword.name.toLowerCase()) > -1
            });

            var categories = Object.keys($scope.pictureData);
            for (var i = 0, len = categories.length; i < len; i++) {
                var current = categories[i];
                var result = $scope.pictureData[current].filter(function(item) {
                    for (var j = 0, l = resultKeys.length; j < l; j++) {
                        if (item.name == resultKeys[j])
                            return true;
                    }
                });

                if (result && result.length > 0) {
                    result.forEach(function(d) {
                        filtered_data.push(d);
                    });
                }
            }
        }

        if ($.isFunction(cb)) {
            cb(filtered_data);
        }
    }

    $scope.search = function() {
        calcInnerHeight();
        $scope.searchWord = $('#searchWord').val();
        if (!$scope.searchWord || $scope.searchWord == '') {
            alert(Lang.Menus.searchword_required);
            return false;
        }

        filterPictureData({ name: $scope.searchWord }, function(filtered_data) {
            $scope.systemPictures = [];
            for (var i in filtered_data) {
                var picture = filtered_data[i];
                picture.selected = 'boxOuter';
                for (var j in $scope.selectedPictures) {
                    if ($scope.selectedPictures[j]._id === picture._id) {
                        picture.selected = 'boxOuter selected';
                        break;
                    }
                }

                $scope.systemPictures.push(picture);
            }
            $scope.collapse(0);
            $scope.main_menu = '';
        });
    };


    $scope.upload = function() {
        var uploadFile = document.getElementById("uploadFile").files;

        if (!uploadFile || uploadFile.length === 0) {
            alert(Lang.Menus.file_required);
            return false;
        }

        if (uploadFile.length > 10) {
            alert(Lang.Menus.file_upload_max_count);
            return false;
        }

        for (var i = 0, len = uploadFile.length; i < len; i++) {
            var file = uploadFile[i];

            var isImage = (/^image\//).test(file.type);
            if (!isImage) {
                alert(Lang.Menus.image_file_only);
                return false;
            }

            if (file.size > 1024 * 1024 * 10) {
                alert(Lang.Menus.file_upload_max_size);
                return false;
            }
        }

        $scope.$apply(function() {
            $scope.isUploading = true;
        });

        var images = [];
        for (var i = 0; i < uploadFile.length; i++) {
            images.push(uploadFile[i].path);

        }

        $scope.uploadPictureFile(images);
    };

    $scope.uploadPictureFile = function(images) {
        try {
            Entry.plugin.uploadTempImageFile(images, function(data) {
                if (data && data.length > 0) {
                    $scope.$apply(function() {
                        $scope.isUploading = false;
                        if (!$scope.uploadPictures)
                            $scope.uploadPictures = [];

                        data.forEach(function(item) {
                            $scope.uploadPictures.push(item);
                        });
                    });
                }
            });
        } catch (e) {
            $scope.$apply(function() {
                $scope.isUploading = false;
                alert(Lang.Msgs.error_occured);
            });
        }
    };


    $scope.collapse = function(dest) {
        for (var i = 1; i <= 12; i++)
            $scope['isCollapsed' + i] = true;

        if (dest > 0) {
            $scope['isCollapsed' + dest] = false;
            $('#searchWord').val('');
        }

    };

    $scope.selectSystem = function(picture) {
        let _id;
        if ($.isPlainObject(picture._id)) {
            _id = JSON.stringify(picture._id);
        } else {
            _id = picture._id;
        }

        var clonePicture = $.extend({}, picture, true);
        $scope.changeLanguage(clonePicture);
        $scope.selectedPictures[0] = clonePicture;

        $('.boxOuter.selected').removeClass('selected');
        var elements = jQuery('.boxOuter').each(function() {
            var element = jQuery(this);
            if (element.attr('id') === _id) {
                element.attr('class', 'boxOuter selected');
            }
        });
    };

    $scope.changeLanguage = function(picture) {
        if ($scope.language !== 'ko') {
            picture.name = PictureNames[picture.name] || picture.name;
        }
    }

    $scope.applySystem = function(picture) {
        var clonePicture = $.extend({}, picture, true);
        $scope.selectedPictures = [];
        $scope.changeLanguage(clonePicture);
        $scope.selectedPictures.push(clonePicture);

        $modalInstance.close({
            target: $scope.currentTab,
            data: $scope.currentSelected()
        });
    };

    $scope.selectUpload = function(picture) {
        $scope.selectedUpload[0] = picture;

        $('.boxOuter.selected').removeClass('selected');
        var elements = jQuery('.boxOuter').each(function() {
            var element = jQuery(this);
            if (element.attr('id') === picture._id) {
                element.attr('class', 'boxOuter selected');
            }
        });
    };

    $scope.tabs = [{
        title: 'Workspace.select_picture',
        category: 'system',
        partial: './views/modal/picture_library.html',
        active: true
    }, {
        title: 'Workspace.upload',
        category: 'upload',
        partial: './views/modal/picture_upload.html'
    }];


    // 탭 이동
    $scope.changeTab = function(tab) {
        $scope.currentIndex = 0;
        var mover = jQuery('.modal_selected_container_moving').eq(0);
        mover.css('margin-left', 0);
        $scope.currentTab = tab;
    };

    $scope.moveContainer = function(direction) {
        var pictures;

        if ($scope.currentTab === "upload") {
            pictures = $scope.selectedUpload;
        } else {
            pictures = $scope.selectedPictures;
        }

        if (pictures.length <= 5)
            return;

        var mover = jQuery('.modal_selected_container_moving').eq(0);
        if (direction == 'left') {
            if ($scope.currentIndex + 2 > pictures.length)
                return;
            $scope.currentIndex++;
            mover.animate({
                marginLeft: '-=106px',
                duration: '0.2'
            }, function() {});
        } else {
            if ($scope.currentIndex - 1 < 0)
                return;
            $scope.currentIndex--;
            mover.animate({
                marginLeft: '+=106px',
                duration: '0.2'
            }, function() {});
        }
    }

    $scope.currentSelected = function() {
        if ($scope.currentTab === 'system') {
            return $scope.selectedPictures;
        } else if ($scope.currentTab === 'upload') {
            return $scope.selectedUpload;
        } else if ($scope.currentTab === 'textBox') {
            return 'textBox';
        } else {
            return null;
        }
    };

    // 적용
    $scope.ok = function() {
        if (!$scope.currentSelected()) {
            alert(Lang.Workspace.select_sprite);
        } else {
            $modalInstance.close({
                target: $scope.currentTab,
                data: $scope.currentSelected()
            });
        }
    };

    // 취소
    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };

    $scope.addNewPicture = function() {
        $modalInstance.close({
            target: 'new'
        });
    };

    $scope.loadMore = function() {
        if ($scope.showCount < $scope.systemPictures.length) {
            $scope.showCount += 6; // append next one line
        }
    };
}]);
