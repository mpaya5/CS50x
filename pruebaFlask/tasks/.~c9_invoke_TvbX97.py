from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/")
def tasks():
    return render_tem

@app.route("/add")
def add():
    return "ADD A NEW TASK"