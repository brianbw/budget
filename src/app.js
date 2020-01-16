
// BUDGET CONTROLLER
var budgetController = ( function() {
    var Expense = function(description, id, value) {
        this.description = description;
        this.id = id;
        this.value = value;
        this.percentage = -1;   
    };

    Expense.prototype.calcPercentage = function(totalIncome) {  
        if (totalIncome > 0)    
            this.percentage = Math.round((this.value / totalIncome) * 100);

        else 
            this.percentage = -1;
    };

    Expense.prototype.getPercentage = function() { 
        return this.percentage;
    }

    var Income = function(description, id, value) {
        this.description = description;
        this.id = id;
        this.value = value;
    };

    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(curr) {    
            sum += curr.value;  
        });

        data.totals[type] = sum;
    };

    var data = {
        // arrays that hold instances of all Income & Expense objects
        allItems: {     
            exp: [],
            inc: []
        },

        // total count of the value of all Income & Expense objects
        totals: {       
            exp: 0,
            inc: 0
        },

        budget: 0,
        percentage: -1
    };

    return {
        addItem: function(type /*exp or inc*/, des, val) {
            var newItem, ID;

            if (data.allItems[type].length > 0)
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;    // last item id + 1
            else  
                ID = 0;

            if (type === 'exp')
                newItem = new Expense(des, ID, val);
            else if (type === 'inc')
                newItem = new Income(des, ID, val);

            data.allItems[type].push(newItem);  

            return newItem;
        },

        deleteItem: function(type, id) {
            var index; 

            // similar to forEach(), but map() returns a brand new array
            var ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            // returns the index number where id belongs inside ids, returns -1 if not found
            index = ids.indexOf(id);    

            if (index !== -1)
                data.allItems[type].splice(index, 1);   
                // 1st argument, position we start deleting from, 2nd argument, how many elements we want to delete

        },

        calculateBudget: function () {
            
            // calculate total income & expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // calculate budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // calculate percentage of income that we spent
            // only done when income > 0, or we get division by 0 or negative %
            if (data.totals.inc > 0)   
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            else 
                data.percentage = -1;   
                // we check that when it is -1 when updating UI, we don't display
        },

        calculatePercentages: function () {
            // for every instance of Expense object, calculate percentage
            data.allItems.exp.forEach(function(curr) {
                curr.calcPercentage(data.totals.inc);
            });
        },

        getBudget: function () {
            return {
                budget: data.budget,
                percentage: data.percentage,
                totalExp: data.totals.exp,
                totalInc: data.totals.inc
            }
        },

        getPercentages: function () {
            // map is like forEach but returns something 
            // for each instance of Expense object, get its percentage, store in allPerc
            var allPerc = data.allItems.exp.map(function(curr) { 
                return curr.getPercentage();                     
            });

            return allPerc;
        },

        testing: function() {
            console.log(data);
        }
    };

}) ();



// UI CONTROLLER
var UIController = ( function() {
    
    /* -------------- PRIVATE ------------------- */
    // this makes it less hard-coded, incase we change the html we only have to change here
    var DOMstrings = {  
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };

    // only used in UI, so private
    var formatNumber = function(num, type) {    
        var numSplit, int, dec;
        /*
            + or - before number
            exactly 2 decimal points
            comma separating thousands

            2310.4567 -> + 2,310.46
            2000 -> + 2,000.00
        */

        num = Math.abs(num);        // removes sign of number
        num = num.toFixed(2);       // method of number protoype, set precision to 2, converted into object when we try to use methods on number primitives
        numSplit = num.split('.');  // separate integer & decimal
       
        int = numSplit[0];
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' +  int.substr(int.length - 3, int.length);   
            // input 2310, output 2,310
            // 0 to before 3, before 3 to end of str
        }

        dec = numSplit[1];

        return  (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;   
        // '-' or '+' followed by int.dec
    };

    // making our own forEach function
    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i ++)
            callback(list[i], i);
    };

    /* -------------- PRIVATE ------------------- */


    /* -------------- PUBLIC -------------------- */
    return {    
        getInput: function() {      
            // return an object holding the users input
            return {
                type: document.querySelector(DOMstrings.inputType).value,  // will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
                //         ^ is like ParseInt, but b/c we allow decimals too, it is float
            };
        },

        addListItem: function(obj, type) {    // add item to UI
            var html, newHtml, element;

            // create HTML string w/ placeholder text
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                // ##### use ALT + Z in vs code to enable 1 line to expand
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            else if (type == 'exp') {
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }


            // replace placeholder text w/ actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);   
            // to determine where to insert, look on https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML

        },

        deleteListItem: function(selectorID) {  // selectorID is the whole inc-id/exp-id
            // in js, we can only delete child, not element, so we have to go to the parent first to delete it
            var element = document.getElementById(selectorID);
            element.parentNode.removeChild(element);    
            // traverse from current to parent to delete child (which is current), for more info, look on blog.garstasio.com/you-dont-need-jquery/dom-manipulation/
        },

        clearFields: function () {
            var fields, fieldsArr;

            // can do this w/ 2 lines of code too, this is same as doing regular queryselector twice but this returns a list instead 
            // (which we have to convert to an array), the list doesn't have the built-in methods than an array has
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            // we have to use the slice array method & pass in a list, then it will return an array, but it won't work if we just fields.slice()
            // the slice() function is inside the Array object's prototype, so we can access it as follow, and since slice() is a function, 
            // we can use .call() on it and pass it fields
            fieldsArr = Array.prototype.slice.call(fields);

            // new forloop, we pass in a callback function which will be applied to each element in the array, 
            // so what we want to do is do some sort of removal in that function (the function has access of up to 3 vars
            // automatically has access to the current value, current index #, and 
            // whole array (similar to when we did eventListeners, the anonymous function had access to the event)
            fieldsArr.forEach(function (current, index, array) {
                current.value = "";
            });

            // this allows the cursor to select the 1st element again (inputDescription), after the removal of the values
            fieldsArr[0].focus();

        },

        displayBudget: function(obj) {
            var type;

            obj.budget > 0 ? type = 'inc' : type = 'exp';

            // have to change to formatNumber to format into decimal, etc.
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage;
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');

            if (obj.percentage > 0) // if negative or 0%, then we don't show anything
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            
            else  
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';  

        },

        displayPercentages: function(percentages) {

            // since we need to select item__percentage of each Expense object, we need to use querySelectorAll or only the 1st element will be selected
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

            // this is the call, and the callback function allows us to have acess to the current, and index
            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0)
                    current.textContent = percentages[index] + '%';

                else    
                    current.textContent = '---';
            });
        },

        displayMonth: function() {      // used to display month & year on top, called in init
            var now, year, month;  
            // var chrismtas = new Date(2019, 12, 25);

            now = new Date();

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        changedType: function() {
            // we have to add/remove css classes, like the .red for the checkmark button or .red-focus for the 3 input bars

            // these are the items we want the focus on
            var fields = document.querySelectorAll(     
                DOMstrings.inputType + ','  +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue );

            // fields is a nodeList, so we have to use nodeListForEach     
            nodeListForEach(fields, function(curr) {    // toggle => add if not there, remove if there
                curr.classList.toggle('red-focus');     // this allows the highlights of the input for expenses to be red
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');    
            // this will change the checkmark button to red when we select expenses
        },

        getDOMstrings: function () {  
            // allow access to private field 
            return DOMstrings;
        }
    };
    /* -------------- PUBLIC -------------------- */

}) ();



// GLOBAL APP CONTROLLER
var controller = ( function(budgetCtrl, UICtrl) { 

    /* -------------- PRIVATE ------------------- */
    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        // records any keypress, look at keyCode inside event to know which key
        document.addEventListener('keypress', function(event) {
           if (event.keyCode === 13 || event.which === 13)     // event.which is for older browsers
               ctrlAddItem();
        });

        // add functionality to delete incomes/expenses
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        // add change event for exp/inc color highlight
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };

    var updateBudget = function () {
        
        // 1) calculate the budget
        budgetCtrl.calculateBudget();

        // 2) return the budget
        var budget = budgetCtrl.getBudget();

        // 3) display the budget on the UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function() {

        // 1) calculate the percentages
        budgetCtrl.calculatePercentages();

        // 2) read percentages from budget controller
        var percentages = budgetCtrl.getPercentages();

        // 3) update the UI w/ new percentages
        UICtrl.displayPercentages(percentages);
    };

    var ctrlAddItem = function() {
        var input, newItem;

        // 1) get the filed input data
        input = UICtrl.getInput();

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            // 2) add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3) add item to the UI
            UICtrl.addListItem(newItem, input.type);

            // 4) clear the fields
            UICtrl.clearFields();

            // 5) calculate and display the budget on the UI
            // ^ we combine these and use a function b/c we need to do the same when we delete an item
            updateBudget();

            // 6) calculate & update percentages
            updatePercentages();
        }
    };

    var ctrlDeleteItem = function(event) {  // event is accesible arg in addEventListener
        
        // console.log(event.target.parentNode.parentNode.parentNode.parentNode.id);
        // this prints out inc/exp-id, when we click on an item to delete

        // when we click other stuff, there is nothing printing out b/c they don't have an id
        // we can use this to determine when stuff should happen only if id is defined

        var itemID, splitID, type, ID;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        // target's (where event occured) parent's parent's parent's parent's ID
        // although this is hardcoding the HTML, it is okay b/c the HTML itself is hardcoded in the UI controller
        
        if (itemID) {   // changed html to inc-id/exp-id instead of income-id/expense-id, for completeness

            // string has a handy method called split, but since string is a primitive, most thought that we cannot use this, 
            // however, when we call something like that, js automatically converts primitive to object, then we have access to string
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);  
            // make sure to parseInt b/c we can't do string & int comp.


            // 1) delete the item from data structure
            budgetCtrl.deleteItem(type, ID);

            // 2) delete the item from the UI
            UICtrl.deleteListItem(itemID);

            // 3) update & show new budget
            updateBudget();

            // 4) calculate & update percentages
            updatePercentages();
        }
    };

    /* -------------- PRIVATE ------------------- */


    /* -------------- PUBLIC -------------------- */
    return {
        init: function() {
            console.log('Application has started.');
            UICtrl.displayMonth();
            
            // this is done to initialize everything to 0
            UICtrl.displayBudget({              
                budget: 0,
                percentage: 0,
                totalExp: 0,
                totalInc: 0
            });
            setupEventListeners();
        }

    };
    /* -------------- PUBLIC -------------------- */


}) (budgetController, UIController); 



controller.init();
