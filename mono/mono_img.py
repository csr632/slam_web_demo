from __future__ import absolute_import, division, print_function

# only keep warnings and errors
import os
import sys
os.environ['TF_CPP_MIN_LOG_LEVEL']='0'

import numpy as np
import argparse
import re
import time
import tensorflow as tf
import tensorflow.contrib.slim as slim
import scipy.misc
import matplotlib.pyplot as plt
import uuid

from monodepth_model import *
from monodepth_dataloader import *
from average_gradients import *
from preprocess import image_crop, image_resize

encoder = 'vgg'
image_path = sys.argv[1]
checkpoint_path = '/home/csr/monodepth/models/model_city2kitti'
input_height = 256
input_width = 512
output_dir = '/home/csr/web_slam/se/mono_img_output'

def post_process_disparity(disp):
    _, h, w = disp.shape
    l_disp = disp[0,:,:]
    r_disp = np.fliplr(disp[1,:,:])
    m_disp = 0.5 * (l_disp + r_disp)
    l, _ = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
    l_mask = 1.0 - np.clip(20 * (l - 0.05), 0, 1)
    r_mask = np.fliplr(l_mask)
    return r_mask * l_disp + l_mask * r_disp + (1.0 - l_mask - r_mask) * m_disp

def test_simple(params):
    """Test function."""

    left  = tf.placeholder(tf.float32, [2, input_height, input_width, 3])
    model = MonodepthModel(params, "test", left, None)

    input_image = scipy.misc.imread(image_path, mode="RGB")
    output_name = os.path.splitext(os.path.basename(image_path))[0]
    # original_height, original_width, num_channels = input_image.shape
    # input_image = scipy.misc.imresize(input_image, [input_height, input_width], interp='lanczos')
    input_image = image_crop(image_resize(input_image, input_width, input_height),input_width, input_height)
    input_save_path = os.path.join(output_dir, "{}_input.png".format(output_name))
    plt.imsave(input_save_path, input_image)
    print('{{-input-{{{0}}}-input-}}'.format(input_save_path), end='', flush=True)
    input_image = input_image.astype(np.float32) / 255
    input_images = np.stack((input_image, np.fliplr(input_image)), 0)

    # SESSION
    config = tf.ConfigProto(allow_soft_placement=True)
    sess = tf.Session(config=config)

    # SAVER
    train_saver = tf.train.Saver()

    # INIT
    sess.run(tf.global_variables_initializer())
    sess.run(tf.local_variables_initializer())
    coordinator = tf.train.Coordinator()
    threads = tf.train.start_queue_runners(sess=sess, coord=coordinator)

    # RESTORE
    restore_path = checkpoint_path.split(".")[0]
    train_saver.restore(sess, restore_path)

    disp = sess.run(model.disp_left_est[0], feed_dict={left: input_images})
    disp_pp = post_process_disparity(disp.squeeze()).astype(np.float32)

    # output_directory = os.path.dirname(image_path)

    # np.save(os.path.join(output_directory, "{}_disp.npy".format(output_name)), disp_pp)
    disp_to_img = disp_pp.squeeze()
    save_path = os.path.join(output_dir, "{}_disp.png".format(output_name))
    plt.imsave(save_path, disp_to_img, cmap='plasma')

    print('{{-output-{{{0}}}-output-}}'.format(save_path), end='', flush=True)

def main(_):

    params = monodepth_parameters(
        encoder=encoder,
        height=input_height,
        width=input_width,
        batch_size=2,
        num_threads=1,
        num_epochs=1,
        do_stereo=False,
        wrap_mode="border",
        use_deconv=False,
        alpha_image_loss=0,
        disp_gradient_loss_weight=0,
        lr_loss_weight=0,
        full_summary=False)

    test_simple(params)

if __name__ == '__main__':
    tf.app.run()
