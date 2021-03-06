var ApplicationContainer = {
    beans: {
        prototype: {},
        singleton: {}
    },

    registry: {},

    register: function(name, ref, options) {
        if (!this.lookup(name)) {
            throw Error("A bean with name '" + name + "' has already been registered!");
        }

        switch (options.scope) {
            case "prototype":
                this.beans.prototype[name] = ref;
                break;
            default:
                this.beans.singleton[name] = new ref();
        }

        this.registry[name] = {ref: ref, options: options};
    },

    lookup: function(name) {
        var obj;
        if (this.beans.prototype.hasOwnProperty(name)) {
            obj = { scope: 'prototype', ref: this.beans.prototype[name] };
        } else {
            obj = { scope: 'singleton', ref: this.beans.singleton[name] };
        }

        return obj;
    },

    getBean: function(name) {
        var obj = this.lookup(name);
        if (!obj) throw Error("No bean by name '" + name + "' found!");

        var instance;
        switch (obj.scope) {
            case 'prototype':
                instance = new obj.ref();
                break;
            default:
                instance = obj.ref;
        }

        return instance;
    },

    reload: function() {
        this.beans.prototype = {};
        this.beans.singleton = {};
        for (name in this.registry) {
            if (this.registry.hasOwnProperty(name)) {
                var properties = this.registry[name];
                this.register(name, properties.ref, properties.options);
            }
        }
    }
};

var Dispatcher = {
    SUFFIX: ".controller",

    dispatch: function(name, action, params) {
        var controller = ApplicationContainer.getBean(name + this.SUFFIX);

        var toContinue = true;
        try {
            var interceptResult = controller.beforeInterceptor(params);
            if (interceptResult === false) toContinue = interceptResult;
        } catch (e) {}

        if (toContinue) {
            var actionResult = controller[action](params);
            try {
                controller.afterInterceptor(params);
            } catch (e) {}

            return actionResult;
        }
    },

    isHandled: function(name) {
        return !! ApplicationContainer.getBean(name + this.SUFFIX);
    }
};