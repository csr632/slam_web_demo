from __future__ import absolute_import, division, print_function

# only keep warnings and errors
import os, errno
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
import glob

from monodepth_model import *
from monodepth_dataloader import *
from average_gradients import *
from preprocess import image_crop, image_resize, preprocess_video
from animate import animate

encoder = 'vgg'
video_path = sys.argv[1]
checkpoint_path = '/home/csr/monodepth/models/model_city2kitti'
input_height = 256
input_width = 512
output_dir = '/home/csr/web_slam/se/mono_video_output'
input_frames_dir = '/home/csr/web_slam/se/mono_input_frames'
depth_frames_dir = '/home/csr/web_slam/se/mono_depth_frames'

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

    basename = os.path.basename(video_path)
    filename, file_extension = os.path.splitext(basename)
    input_frames = os.path.join(input_frames_dir, filename)
    try:
        os.makedirs(input_frames)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    depth_frames = os.path.join(depth_frames_dir, filename)
    try:
        os.makedirs(depth_frames)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    preprocess_video(video_path, input_frames, input_width, input_height)

    inputs = []
    frame_filenames = glob.glob('{}/*.jpg'.format(input_frames))
    frame_filenames.sort()
    for frame_filename in frame_filenames:
        input_image = scipy.misc.imread(frame_filename, mode="RGB")
        input_image = input_image.astype(np.float32) / 255
        input_images = np.stack((input_image, np.fliplr(input_image)), 0)
        inputs.append(input_images)

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

    for i, imgs in enumerate(inputs):
        # disp = sess.run(model.disp_left_est[0], feed_dict={left: input_images})
        if (i%20 is 0):
          print('processing {}th frame'.format(i), flush=True)
        disp = sess.run(model.disp_left_est[0], feed_dict={left: imgs})
        disp_pp = post_process_disparity(disp.squeeze()).astype(np.float32)
        disp_to_img = disp_pp.squeeze()
        save_path = os.path.join(depth_frames, "{:05}_disp.png".format(i))
        plt.imsave(save_path, disp_to_img, cmap='plasma')

    output_path = os.path.join(output_dir, '{}.mp4'.format(filename))
    animate(depth_frames, output_path)
    print('{{-output-{{{0}}}-output-}}'.format(output_path), end='', flush=True)

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
