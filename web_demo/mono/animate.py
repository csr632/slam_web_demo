import numpy as np
import matplotlib.pyplot as plt
# https://stackoverflow.com/a/23857984
plt.rcParams['animation.ffmpeg_path'] = '/usr/bin/ffmpeg'
import matplotlib.image as mpimg
import matplotlib.animation as animation
import glob
import sys

def animate(frames_path, output_path):
  frames = glob.glob('{}/*.png'.format(frames_path))
  frames.sort()

  # https://matplotlib.org/2.1.2/gallery/animation/basic_example_writer_sgskip.html
  Writer = animation.writers['ffmpeg']
  writer = Writer(fps=15, metadata=dict(artist='Me'), bitrate=-1)

  # https://matplotlib.org/2.1.2/gallery/animation/dynamic_image2.html
  fig = plt.figure()

  ims = []
  for i in range(len(frames)):
      frame = mpimg.imread(frames[i])
      im0 = plt.imshow(frame, animated=True)
      ims.append([im0])

  ani = animation.ArtistAnimation(fig, ims, interval=70, blit=True,
                                  repeat_delay=1000)

  ani.save(output_path, writer=writer)
  print('video {} saved'.format(output_path), flush=True)

  # plt.show()
