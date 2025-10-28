'''
app.py

Ray Whorley
School of Chemistry and Chemical Engineering
University of Southampton
Started 23/07/2025
'''

import os
import matplotlib
import matplotlib.pyplot as plt
from numpy import mean, std, sqrt
from scipy.stats import t, norm 
from io import BytesIO
from flask import Flask, request, render_template, abort, Response, send_file

app = Flask(__name__)

@app.route('/')
def website():
    """"Return the web page
    """
    return render_template("index.htm")

@app.route('/generate/', methods=['POST'])
def generate_plot():
    compound_label = request.form['compound']
    measurement_type = request.form['type']
    measurements = request.form['measurements']
    plot_width = int(request.form['imageWidth']) / 100   # inches
    plot_height = int(request.form['imageHeight']) / 100 # inches
    #font_size = 10 + (plot_height - 4.8) * 1.3
    font_size = 10 * plot_height / 4.8
    title_font_size = 12 * plot_height / 4.8
    box_horiz = 1 - 0.29 * font_size / 10

    data = []
    start = finish = 0
    num_measurements = 0
    while True:
        finish = measurements.find('£')
        num_measurements += 1

        try:
            data.append(float(measurements[start:finish]))
        except ValueError:
            break

        measurements = measurements[finish + 1: len(measurements)]

    # Calculate mean yield, sample size (n) and standard deviation
    mean_yield = mean(data)
    sample_size = len(data)
    std_dev = std(data, ddof=1)

    print('mean = ' + str(mean_yield))
    print('size = ' + str(sample_size))
    print('std_dev = ' + str(std_dev))

    # Calculate standard error for the mean yield
    std_err = std_dev / sqrt(sample_size)

    print('std_err = ' + str(std_err))

    if sample_size < 30:
        # Critical value of t distribution (two-tailed test)
        crit_val = t.ppf(1 - 0.05 / 2, sample_size - 1)
    else:
        # Critical value of z distribution (two-tailed test)
        crit_val = norm.ppf(1 - 0.05 / 2)

    print('crit_val = ' + str(crit_val))

    # 95% confidence interval for the mean yield
    ci_interval = crit_val * std_err
    lower_bound = round(mean_yield - ci_interval)
    upper_bound = round(mean_yield + ci_interval)

    print('interval = ' + str(ci_interval))
    print(str(lower_bound) + '  ' + str(upper_bound))

    iteration = []
    for n in range(1, sample_size + 1):
        iteration.append(n)

    x_label = 'Iteration'
    y_label = f'{measurement_type} of {compound_label} (%)'
    title = f'{measurement_type} of {compound_label}'

    matplotlib.use('agg')
    plt.close()
    plt.figure(figsize=(plot_width, plot_height))
    plt.rcParams.update({'font.size': font_size})
    plt.plot(iteration, data, 'o')

    ax = plt.gca()
    ax.set_ylim([0, 100])
    ax.axhline(mean_yield, color='blue')

    plt.axhspan(lower_bound, upper_bound, color=(0.8, 0.9, 1.0))

    # Place a text box with matplotlib.patch.Patch properties in upper left in axes coords
    # Change the text box colour to red if the range of the confidence interval falls
    # outside of the 0-100% limits
    if lower_bound >= 0 and upper_bound <= 100:
        props = dict(facecolor='white', alpha=0.5)
    else:
        props = dict(facecolor='red', alpha=0.5)

    text = f'Mean yield = {round(mean_yield)}%\n95% Confidence interval: ' \
        f'{lower_bound}% to {upper_bound}%'
    ax.text(box_horiz, 0.115, text, transform=ax.transAxes, horizontalalignment='center', \
        verticalalignment='top', bbox=props) # 0.71

    plt.xlabel(x_label)
    plt.xticks(range(1, num_measurements))
    plt.ylabel(y_label)
    plt.title(title, fontsize=title_font_size)
    plt.grid()
    img = BytesIO()
    plt.savefig('static/fig/fig.png')
    #plt.savefig(f'static/fig/{compound_label}.png')
    #plt.savefig(img)
    img.seek(0)
    sum = 0
    for n in range(1000000):
        sum = sum + n
    return Response(status=200)
    #return send_file(img, mimetype='image/png')
    #website()
    #return render_template("index.htm")

@app.route('/download/', methods=['POST'])
def download_plot():
    format = request.form['format']
    print(format)
    plt.savefig('static/fig/fig.' + format)
    return Response(status=200)

@app.route('/delete/', methods=['POST'])
def delete_plot():
    os.remove('static/fig/fig.png')
    return Response(status=200)
