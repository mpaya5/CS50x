import os

from cs50 import SQL
from flask import Flask, flash, jsonify, redirect, render_template, request, session
from flask_session import Session
from tempfile import mkdtemp
from werkzeug.exceptions import default_exceptions, HTTPException, InternalServerError
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, lookup, usd

#API_KEY=pk_fa40ad015cb043aab968213ba3dfd510

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///finance.db")


# Make sure API key is set
if not os.environ.get("API_KEY"):
    raise RuntimeError("API_KEY not set")


@app.route("/")
@login_required
def index():
    """Show portfolio of stocks"""

    #Get Username
    username = db.execute("SELECT username FROM users WHERE id = :uid", uid=int(session['user_id']))[0]["username"]

    #Add and create List
    stocks = db.execute("SELECT symbol, shares FROM portfolio WHERE username = :username", username=username)

    #List to add all totals
    total_sum = []

    #Iterate over the stocks list to append the faulty information needed in index.html table
    for stock in stocks:
        symbol = str(stock["symbol"])
        shares = int(stock["shares"])
        name = lookup(symbol)["name"]
        price = lookup(symbol)["price"]
        total = shares * price
        stock["name"] = name
        stock["price"] = usd(price)
        stock["total"] = usd(total)
        total_sum.append(float(total))

    #Declare the cash available and grand total
    cash_available = db.execute("SELECT cash FROM users WHERE username = :username", username=username)[0]["cash"]
    cash_total = sum(total_sum) + cash_available

    return render_template("index.html", stocks=stocks, cash_available=usd(cash_available), cash_total=usd(cash_total))


@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    #VIA POST
    if request.method == "POST":

        #Look into the dictionary returned from the search
        look = lookup(request.form.get("symbol"))

        #Check symbol is valid
        if look == None:
            return apology("invalid symbol", 400)

        #Store the shares
        shares = request.form.get("shares")

        #Check the share is valid
        if not shares.isdigit() or int(shares) <1:
            return apology("share must be at least 1", 400)

        #Check the money of the user
        cash = db.execute("SELECT cash FROM users WHERE id = :uid", uid=int(session['user_id']))

        #Store the value of the purchase
        value = look["price"] * int(shares)

        #If not have enough money
        if int(cash[0]["cash"]) < value:
            return apology("You don't have enough money", 403)

        #If have enough money
        else:
            #Subtract value of purchase from user's cash
            db.execute("UPDATE users SET cash = cash - :value WHERE id = :uid", value=value, uid=int(session['user_id']))

            #Add transaction to user's history
            db.execute("INSERT INTO history (username, operation, symbol, price, shares) VALUES (:username, 'BUY', :symbol, :price, :shares)",
            username=db.execute("SELECT username FROM users WHERE id = :uid", uid=int(session['user_id']))[0]["username"],
            symbol=look['symbol'], price=look['price'], shares=request.form.get('shares'))

            #Add stock to user's portfolio
            db.execute("INSERT INTO portfolio (username, symbol, shares) VALUES (:username, :symbol, :shares)",
            username=db.execute("SELECT username FROM users WHERE id = :uid", uid=int(session['user_id']))[0]["username"],
            symbol=look['symbol'], shares=request.form.get('shares'))

            #Return to portfolio
            return redirect("/")



    #VIA GET
    else:
        return render_template("buy.html")


@app.route("/history")
@login_required
def history():
    """Show history of transactions"""

    #Get username
    username = db.execute("SELECT username FROM users WHERE id = :uid", uid=int(session['user_id']))[0]["username"]

    #Add info to List
    stocks = db.execute("SELECT operation, symbol, price, date, time, shares FROM history WHERE username = :username", username=username)

    #Append the info
    for stock in stocks:
        symbol = str(stock["symbol"])
        name = lookup(symbol)["name"]
        stock["name"] = name

    return render_template("history.html", stocks=stocks)

@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    """Change profile settings."""
    #VIA POST
    if request.method == "POST":

        #All Fields completes
        if not request.form.get("old_password") or not request.form.get("password") or not request.form.get("confirm_password"):
            return apology("don't let any input in blank", 400)

        #Get elements
        old_password = request.form.get("old_password")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        #Get username
        user = db.execute("SELECT * FROM users WHERE id = :user_id", user_id=session["user_id"])

        #Check old password is correct
        if not request.form.get("password"):
            return apology("password is incorrect", 403)

        #New Password match
        if password != confirm_password:
            return apology("new passwords do not match")

        #Change the password
        hash = generate_password_hash(request.form.get("password"))
        db.execute("UPDATE users SET hash = :hash WHERE id = :user_id", hash=hash, user_id=session["user_id"])

        return render_template("profile.html", success=1)

    #VIA GET
    else:
        return render_template("profile.html")



@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE username = :username", username=request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/quote", methods=["GET", "POST"])
@login_required
def quote():
    """Get stock quote."""
    #VIA POST
    if request.method == "POST":

        #Look into the dictionary returned from the search
        look = lookup(request.form.get("symbol"))

        #Check symbol is valid
        if look == None:
            return apology("invalid symbol", 400)

        #If exists return the search
        else:
            return render_template("quoted.html", name=look["name"], symbol=look["symbol"], price=usd(look["price"]))

    #VIA GET
    else:
        return render_template("quote.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""
    #VIA POST
    if request.method == "POST":

        #Check username is not empty
        if not request.form.get("username"):
            return apology("please, provide a username", 400)

        #Check username is unique
        rows = db.execute("SELECT * FROM users WHERE username = :username", username=request.form.get("username"))
        if len(rows) >= 1:
            return apology("username already exists", 400)

        #Check password is not empty
        elif not request.form.get('password'):
            return apology("please, provide a password", 400)

        #Check password & password confirmation match
        elif request.form.get('password') != request.form.get("password_confirm"):
            return apology("your password is not the same", 400)

        #Hash the password
        hash = generate_password_hash(request.form.get("password"))

        #Insert into the database
        addResult = db.execute("INSERT INTO users(username, hash) VALUES (:username, :hash)", username=request.form.get("username"), hash=hash)

        #Start session
        rows = db.execute("SELECT * FROM users WHERE username = :username", username=request.form.get("username"))

        session["user_id"] = rows[0]["id"]

        #Redirect user to home
        return redirect("/")

    #VIA GET
    else:
        return render_template("register.html")

@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    """Sell shares of stock"""

    #Get username
    username = db.execute("SELECT username FROM users WHERE id = :uid", uid=int(session['user_id']))[0]["username"]

    if request.method == "POST":
        #Get Symbol
        look = lookup(request.form.get("symbol"))

        #Get Shares
        shares = request.form.get("shares")

        #Store the number of shares the user has
        user_shares = db.execute("SELECT shares FROM portfolio WHERE username = :username and symbol = :symbol",
                        username=username, symbol=str(request.form.get("symbol")))[0]["shares"]

        #Store the value of sale
        value = look["price"] * int(shares)

        #If symbol or share is Invalid
        if not request.form.get("symbol") or look == None:
            return apology("you must provide a stock", 400)
        elif not shares or not shares.isdigit() or int(shares) < 1 or int(shares) > int(user_shares):
            return apology("share number is invalid", 400)

        #If goes well:
        else:
            #Add the value of sale to the user's cash
            db.execute("UPDATE users SET cash = cash + :value WHERE id = :uid", value=value, uid=int(session['user_id']))

            #Add the transaction to the user's history
            db.execute("INSERT INTO history (username, operation, symbol, price, shares) VALUES (:username, 'SELL', :symbol, :price, :shares)",
            username=username, symbol=look['symbol'], price=look['price'], shares=request.form.get('shares'))

            #If the user is selling all the shares, remove the stock from the user's portfolio
            if int(user_shares) == int(shares):
                db.execute("DELETE FROM portfolio WHERE username = :username and symbol = :symbol",
                            username=username, symbol=str(request.form.get("symbol")))

            #If the user is just selling some of the shares, update the portfolio
            elif int(user_shares) > int(shares):
                db.execute("UPDATE portfolio SET shares = :shares WHERE username = :username and symbol = :symbol",
                            shares=shares, username=username, symbol=request.form.get("symbol"))

        #Go to Portfolio
        return redirect("/")

    #User reached route via GET (as by clicking a link or via redirect)
    else:

        #Get the symbols from portfolio for the select list
        symbols = db.execute("SELECT symbol FROM portfolio WHERE username = :username", username=username)

        return render_template("sell.html", symbols=symbols)


def errorhandler(e):
    """Handle error"""
    if not isinstance(e, HTTPException):
        e = InternalServerError()
    return apology(e.name, e.code)


# Listen for errors
for code in default_exceptions:
    app.errorhandler(code)(errorhandler)
